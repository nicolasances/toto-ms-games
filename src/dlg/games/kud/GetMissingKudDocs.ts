import { Request } from "express";
import { ExecutionContext } from "../../../controller/model/ExecutionContext";
import { TotoDelegate } from "../../../controller/model/TotoDelegate";
import { UserContext } from "../../../controller/model/UserContext";
import { KuploadGame } from "../../../games/kud/KuploadGame";

export class GetMissingKudDocs implements TotoDelegate {

    async do(req: Request, userContext: UserContext, execContext: ExecutionContext): Promise<any> {

        // Get the game 
        const game = new KuploadGame(userContext, execContext)

        // Get the list of missing kuds
        const missingKuds = await game.getMissingKuds()

        // Return the list
        return { missingKuds: missingKuds }
        
    }

}