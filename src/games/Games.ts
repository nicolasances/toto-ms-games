import { ExecutionContext } from "../controller/model/ExecutionContext";
import { UserContext } from "../controller/model/UserContext";
import { Game } from "./GameModel";
import { KuploadGame } from "./kud/KuploadGame";
import { RekoncileGame } from "./rekoncile/RekoncileGame";

export const Games: IIndexable = {
    kupload: {
        id: "kupload",
        desc: "Upload all your DanskeBank Kontoudskrift Documents",
        newManager: (userContext: UserContext, execContext: ExecutionContext, authHeader: string) => { return new KuploadGame(userContext, execContext, authHeader) }
    },
    rekoncile: {
        id: "rekoncile",
        desc: "Reconcile all you DanskeBank Kontoudskrift payments with Toto payments", 
        newManager: (userContext: UserContext, execContext: ExecutionContext, authHeader: string) => { return new RekoncileGame(userContext, execContext, authHeader) }
    },
    cashin: {
        id: "cashin",
        desc: "Register your incomes into Toto, month by month"
    },
    kashrek: {
        id: "kashrek",
        desc: "Reconcile your Toto incomes with Kontoudskrift incomes"
    }
}

interface IIndexable {
    [key: string]: GameDef
}

interface GameDef {
    id: string
    desc: string
    newManager?: any
}