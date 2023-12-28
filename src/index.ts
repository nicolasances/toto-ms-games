import { TotoAPIController } from "toto-api-controller";
import { ControllerConfig } from "./Config";
import { PostKudDocument } from "./dlg/games/kud/PostKudDocument";
import { GetMissingKudDocs } from "./dlg/games/kud/GetMissingKudDocs";
import { KudEventHandlerHook } from "./evt/KudEventHandlerHook";
import { GetKuploadGame } from "./dlg/games/kud/GetKuploadGame";
import { GetGamesOverview } from "./dlg/GetGamesOverview";
import { PostMissingKud } from "./dlg/games/kud/PostMissingKud";
import { GetNextTransaction } from "./dlg/games/rekoncile/GetNextTransaction";
import { PostReconcilitation } from "./dlg/games/rekoncile/PostReconcilitation";
import { GetRekoncileGame } from "./dlg/games/rekoncile/GetRekoncileGame";
import { CreateTotoExpense } from "./dlg/games/rekoncile/CreateTotoExpense";
import { GetNextCattieRound } from "./dlg/games/cattie/GetNextCattieRound";
import { ChooseCategory } from "./dlg/games/cattie/ChooseCategory";
import { GetCattieGameStatus } from "./dlg/games/cattie/GetCattieGameStatus";
import { StartBackup } from "./dlg/backup/StartBackup";
import { StartRestore } from "./dlg/backup/StartRestore";
import { InvalidateKudTransaction } from "./dlg/games/rekoncile/InvalidateKudTransaction";

const api = new TotoAPIController("toto-ms-games", new ControllerConfig())

api.path("GET", "/games", new GetGamesOverview())

api.path('GET', '/games/kupload', new GetKuploadGame())
api.path("GET", "/games/kuddoc/missing", new GetMissingKudDocs())
api.path("POST", "/games/kuddoc/missing", new PostMissingKud())
api.fileUploadPath("/games/kuddoc/upload", new PostKudDocument())

api.path('GET', '/games/rekoncile', new GetRekoncileGame())
api.path('GET', '/games/rekoncile/next', new GetNextTransaction())
api.path('POST', '/games/rekoncile/reconciliations', new PostReconcilitation())
api.path('POST', '/games/rekoncile/invalidate', new InvalidateKudTransaction())
api.path('POST', '/games/rekoncile/expenses', new CreateTotoExpense())

api.path('GET', '/games/cattie/next', new GetNextCattieRound())
api.path('POST', '/games/cattie/selections', new ChooseCategory())
api.path('GET', '/games/cattie', new GetCattieGameStatus())

api.path('POST', '/events/kud', new KudEventHandlerHook())

api.path('POST', '/backup', new StartBackup())
api.path('POST', '/restore', new StartRestore())

api.init().then(() => {
    api.listen()
});