import { Request } from "express";
import { ExecutionContext } from "../../../controller/model/ExecutionContext";
import { TotoDelegate } from "../../../controller/model/TotoDelegate";
import { UserContext } from "../../../controller/model/UserContext";
import { KudDocGame } from "../../../games/kud/KudDocGame";

export class GetMissingKudDocs implements TotoDelegate {

    async do(req: Request, userContext: UserContext, execContext: ExecutionContext): Promise<any> {

        // Get the game 
        const game = new KudDocGame(userContext, execContext)

        // Get the list of missing kuds
        const missingKuds = await game.getMissingKuds()

        // Return the list
        return { missingKuds: missingKuds }
        
    }

}