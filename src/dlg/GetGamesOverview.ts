import { Request } from "express";
import { ExecutionContext } from "../controller/model/ExecutionContext";
import { TotoDelegate } from "../controller/model/TotoDelegate";
import { UserContext } from "../controller/model/UserContext";
import { GamesManager } from "../games/GamesManager";
import { extractAuthHeader } from "../util/AuthHeader";


export class GetGamesOverview implements TotoDelegate {
    
    async do(req: Request, userContext: UserContext, execContext: ExecutionContext): Promise<any> {

        console.log(userContext);
        

        // Get the Overview
        const overview = new GamesManager(userContext, execContext, String(extractAuthHeader(req))).getGamesOverview();

        return overview;
    }

}