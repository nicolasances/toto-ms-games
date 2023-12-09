import { Request } from "express-serve-static-core";
import { TotoDelegate } from "../../../controller/model/TotoDelegate";
import { UserContext } from "../../../controller/model/UserContext";
import { ExecutionContext } from "../../../controller/model/ExecutionContext";
import { extractAuthHeader } from "../../../util/AuthHeader";
import { RekoncileGame } from "../../../games/rekoncile/RekoncileGame";

/**
 * Retrieves information about the Rekoncile Game
 */
export class GetRekoncileGame implements TotoDelegate {

    async do(req: Request, userContext: UserContext, execContext: ExecutionContext): Promise<any> {

        // Retrieve the game
        return await new RekoncileGame(userContext, execContext, String(extractAuthHeader(req))).getGameStatus();

    }

}