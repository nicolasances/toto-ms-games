import { Request } from "express";
import { KuploadGame } from "../../../games/kud/KuploadGame";
import { extractAuthHeader } from "../../../util/AuthHeader";
import { ExecutionContext } from "toto-api-controller/dist/model/ExecutionContext";
import { TotoDelegate } from "toto-api-controller/dist/model/TotoDelegate";
import { UserContext } from "toto-api-controller/dist/model/UserContext";

export class GetMissingKudDocs implements TotoDelegate {

    async do(req: Request, userContext: UserContext, execContext: ExecutionContext): Promise<any> {

        // Get the game 
        const game = new KuploadGame(userContext, execContext, String(extractAuthHeader(req)))

        // Get the list of missing kuds
        const missingKuds = await game.getMissingKuds()

        // Return the list
        return { missingKuds: missingKuds }
        
    }

}