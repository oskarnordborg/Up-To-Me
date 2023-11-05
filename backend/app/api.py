from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

origins = ["http://localhost:3000", "localhost:3000"]


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["root"])
async def read_root() -> dict:
    return {
        "cards": [
            {
                "name": "Card1",
                "description": "Do this and that!",
            },
            {
                "name": "Card2",
                "description": "Do another thing",
            },
            {
                "name": "No way",
                "description": "I will do anything for love, but I won't do that",
            },
        ]
    }
