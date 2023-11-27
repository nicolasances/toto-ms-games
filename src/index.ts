
import { TotoAPIController } from "./controller/TotoAPIController";
import { ControllerConfig } from "./Config";
import { PostGame } from "./dlg/PostGame";
import { GetGames } from "./dlg/GetGames";
import { PostKudDocument } from "./dlg/games/KudGame";

const api = new TotoAPIController("toto-ms-games", new ControllerConfig())

api.path("POST", "/games", new PostGame())
api.path("GET", "/games", new GetGames())

api.fileUploadPath("/games/kud/upload", new PostKudDocument())

api.init().then(() => {
    api.listen()
});