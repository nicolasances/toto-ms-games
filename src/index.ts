
import { TotoAPIController } from "./controller/TotoAPIController";
import { ControllerConfig } from "./Config";
import { PostGame } from "./dlg/PostGame";
import { GetGames } from "./dlg/GetGames";
import { PostKudDocument } from "./dlg/games/kud/PostKudDocument";
import { GetMissingKudDocs } from "./dlg/games/kud/GetMissingKudDocs";
import { KudEventHandlerHook } from "./evt/KudEventHandlerHook";
import { GetKuploadGame } from "./dlg/games/kud/GetKuploadGame";

const api = new TotoAPIController("toto-ms-games", new ControllerConfig())

api.path("POST", "/games", new PostGame())
api.path("GET", "/games", new GetGames())

api.path('GET', '/games/kupload', new GetKuploadGame())
api.path("GET", "/games/kuddoc/missing", new GetMissingKudDocs())
api.fileUploadPath("/games/kuddoc/upload", new PostKudDocument())

api.path('POST', '/events/kud', new KudEventHandlerHook())

api.init().then(() => {
    api.listen()
});