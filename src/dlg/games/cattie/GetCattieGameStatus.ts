import { Request } from "express-serve-static-core";
import { extractAuthHeader } from "../../../util/AuthHeader";
import { CattieGame } from "../../../games/cattie/CattieGame";
import { ExecutionContext } from "toto-api-controller/dist/model/ExecutionContext";
import { TotoDelegate } from "toto-api-controller/dist/model/TotoDelegate";
import { UserContext } from "toto-api-controller/dist/model/UserContext";

/**
 * Retrieves information about the Cattie Game
 */
export class GetCattieGameStatus implements TotoDelegate {

    async do(req: Request, userContext: UserContext, execContext: ExecutionContext): Promise<any> {

        // Retrieve the game
        return await new CattieGame(userContext, execContext, String(extractAuthHeader(req))).getGameStatus();

    }

}