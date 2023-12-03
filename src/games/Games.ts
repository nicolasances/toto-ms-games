import { ExecutionContext } from "../controller/model/ExecutionContext";
import { UserContext } from "../controller/model/UserContext";
import { Game } from "./GameModel";
import { KuploadGame } from "./kud/KuploadGame";

export const Games: IIndexable = {
    kupload: {
        id: "kupload",
        desc: "Upload all your DanskeBank Kontoudskrift Documents",
        newManager: (userContext: UserContext, execContext: ExecutionContext) => { return new KuploadGame(userContext, execContext) }
    },
    rekoncile: {
        id: "rekoncile",
        desc: "Reconcile all you DanskeBank Kontoudskrift payments with Toto payments"
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