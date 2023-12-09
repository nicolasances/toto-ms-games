
import { TotoAPIController } from "./controller/TotoAPIController";
import { ControllerConfig } from "./Config";
import { PostGame } from "./dlg/PostGame";
import { PostKudDocument } from "./dlg/games/kud/PostKudDocument";
import { GetMissingKudDocs } from "./dlg/games/kud/GetMissingKudDocs";
import { KudEventHandlerHook } from "./evt/KudEventHandlerHook";
import { GetKuploadGame } from "./dlg/games/kud/GetKuploadGame";
import { GetGamesOverview } from "./dlg/GetGamesOverview";
import { PostMissingKud } from "./dlg/games/kud/PostMissingKud";
import { GetNextTransaction } from "./dlg/games/rekoncile/GetNextTransaction";
import { PostReconcilitation } from "./dlg/games/rekoncile/PostReconcilitation";
import { GetRekoncileGame } from "./dlg/games/rekoncile/GetRekoncileGame";

const api = new TotoAPIController("toto-ms-games", new ControllerConfig())

api.path("POST", "/games", new PostGame())
api.path("GET", "/games", new GetGamesOverview())

api.path('GET', '/games/kupload', new GetKuploadGame())
api.path("GET", "/games/kuddoc/missing", new GetMissingKudDocs())
api.path("POST", "/games/kuddoc/missing", new PostMissingKud())
api.fileUploadPath("/games/kuddoc/upload", new PostKudDocument())

api.path('GET', '/games/rekoncile', new GetRekoncileGame())
api.path('GET', '/games/rekoncile/next', new GetNextTransaction())
api.path('POST', '/games/rekoncile/reconciliations', new PostReconcilitation())

api.path('POST', '/events/kud', new KudEventHandlerHook())

api.init().then(() => {
    api.listen()
});