from typing import List, Optional

from pydantic import BaseModel


class Game(BaseModel):
    idgame: int
    createdtime: str
    updatedtime: str
    appuser: int
    deck: int
    participants: Optional[List[str]]

    @classmethod
    def from_tuple(cls, data_tuple):
        return cls(
            idgame=data_tuple[0],
            createdtime=str(data_tuple[1])[:-10],
            updatedtime=str(data_tuple[2])[:-10],
            appuser=data_tuple[3],
            deck=data_tuple[4],
            participants=data_tuple[5],
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
        )
