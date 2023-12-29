import { Request } from "express";
import { extractAuthHeader } from "../../../util/AuthHeader";
import { CattieGame } from "../../../games/cattie/CattieGame";
import { ExecutionContext } from "toto-api-controller/dist/model/ExecutionContext";
import { TotoDelegate } from "toto-api-controller/dist/model/TotoDelegate";
import { UserContext } from "toto-api-controller/dist/model/UserContext";

export class GetNextCattieRound implements TotoDelegate {

    async do(req: Request, userContext: UserContext, execContext: ExecutionContext): Promise<any> {

        // Instantiate the game
        const cattie = new CattieGame(userContext, execContext, String(extractAuthHeader(req)))

        // Get the next round
        return await cattie.nextRound();

    }
}