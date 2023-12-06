import { Request } from "express-serve-static-core";
import { TotoDelegate } from "../../../controller/model/TotoDelegate";
import { UserContext } from "../../../controller/model/UserContext";
import { ExecutionContext } from "../../../controller/model/ExecutionContext";
import { KuploadGame } from "../../../games/kud/KuploadGame";
import { extractAuthHeader } from "../../../util/AuthHeader";

/**
 * Retrieves information about the Kupload Game
 */
export class GetKuploadGame implements TotoDelegate {

    async do(req: Request, userContext: UserContext, execContext: ExecutionContext): Promise<any> {

        // Retrieve the game
        return await new KuploadGame(userContext, execContext, String(extractAuthHeader(req))).getGameStatus();

    }

}