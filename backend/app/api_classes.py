from typing import Dict, List, Optional

from pydantic import BaseModel


class GameParticipant(BaseModel):
    name: str
    accepted: bool
    skips_left: int


class Game(BaseModel):
    idgame: int
    createdtime: str
    updatedtime: str
    appuser: int
    deck: int
    participants: Optional[Dict[str, GameParticipant]]
    started: bool = False
    wildcards_count: int
    skips_count: int

    @classmethod
    def from_tuple(cls, data_tuple):
        return cls(
            idgame=data_tuple[0],
            createdtime=str(data_tuple[1])[:-10],
            updatedtime=str(data_tuple[2])[:-10],
            appuser=data_tuple[3],
            deck=data_tuple[4],
            createdby=data_tuple[5],
            updatedby=data_tuple[6],
            deleted=data_tuple[7],
            wildcards_count=data_tuple[8],
            skips_count=data_tuple[9],
            participants=data_tuple[10],
        )


class GameCard(BaseModel):
    idgame_card: int
    createdtime: str
    updatedtime: str
    game: int
    player: int
    performer: Optional[int]
    wildcard: bool
    title: str
    description: str
    played_time: str
    finished_time: str
    card: Optional[int]
    createdby: str
    updatedby: str
    deleted: bool = False
    mycard: bool = False
    performer_name: str = ""

    @classmethod
    def from_tuple(cls, data_tuple):
        return cls(
            idgame_card=data_tuple[0],
            createdtime=str(data_tuple[1])[:-10],
            updatedtime=str(data_tuple[2])[:-10],
            game=data_tuple[3],
            player=data_tuple[4],
            performer=data_tuple[5],
            wildcard=data_tuple[6],
            title=data_tuple[7],
            description=data_tuple[8],
            played_time=str(data_tuple[9])[:-10],
            finished_time=str(data_tuple[10])[:-10],
            card=data_tuple[11],
            createdby=str(data_tuple[12])[:-10],
            updatedby=str(data_tuple[13])[:-10],
            deleted=data_tuple[14],
            mycard=data_tuple[15],
            performer_name=data_tuple[16] if len(data_tuple) > 16 else "",
        )


class Card(BaseModel):
    idcard: int
    title: str
    description: str

    @classmethod
    def from_tuple(cls, data_tuple):
        return cls(
            idcard=data_tuple[0],
            title=data_tuple[4],
            description=data_tuple[5],
        )


class Deck(BaseModel):
    iddeck: int
    title: str
    description: str

    @classmethod
    def from_tuple(cls, data_tuple):
        return cls(
            iddeck=data_tuple[0],
            title=data_tuple[4],
            description=data_tuple[5],
        )


class CardDeckInfo(BaseModel):
    iddeck: int
    deck_title: str
    deck_description: str
    idcard: int
    card_title: str
    card_description: str

    @classmethod
    def from_tuple(cls, data_tuple):
        return cls(
            iddeck=data_tuple[0],
            deck_title=data_tuple[1],
            deck_description=data_tuple[2],
            idcard=data_tuple[3],
            card_title=data_tuple[4],
            card_description=data_tuple[5],
        )
