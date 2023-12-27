import { Request } from "express-serve-static-core";
import { KuploadGame } from "../../../games/kud/KuploadGame";
import { extractAuthHeader } from "../../../util/AuthHeader";
import { ExecutionContext } from "toto-api-controller/dist/model/ExecutionContext";
import { TotoDelegate } from "toto-api-controller/dist/model/TotoDelegate";
import { UserContext } from "toto-api-controller/dist/model/UserContext";

/**
 * Retrieves information about the Kupload Game
 */
export class GetKuploadGame implements TotoDelegate {

    async do(req: Request, userContext: UserContext, execContext: ExecutionContext): Promise<any> {

        // Retrieve the game
        return await new KuploadGame(userContext, execContext, String(extractAuthHeader(req))).getGameStatus();

    }

}