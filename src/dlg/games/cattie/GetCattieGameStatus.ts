import { Request } from "express-serve-static-core";
import { TotoDelegate } from "../../../controller/model/TotoDelegate";
import { UserContext } from "../../../controller/model/UserContext";
import { ExecutionContext } from "../../../controller/model/ExecutionContext";
import { extractAuthHeader } from "../../../util/AuthHeader";
import { CattieGame } from "../../../games/cattie/CattieGame";

/**
 * Retrieves information about the Cattie Game
 */
export class GetCattieGameStatus implements TotoDelegate {

    async do(req: Request, userContext: UserContext, execContext: ExecutionContext): Promise<any> {

        // Retrieve the game
        return await new CattieGame(userContext, execContext, String(extractAuthHeader(req))).getGameStatus();

    }

}