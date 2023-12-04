import { Request } from "express";
import { ExecutionContext } from "../controller/model/ExecutionContext";
import { TotoDelegate } from "../controller/model/TotoDelegate";
import { UserContext } from "../controller/model/UserContext";
import { GamesManager } from "../games/GamesManager";


export class GetGamesOverview implements TotoDelegate {
    
    async do(req: Request, userContext: UserContext, execContext: ExecutionContext): Promise<any> {

        // Get the Overview
        const overview = new GamesManager(userContext, execContext).getGamesOverview();

        return overview;
    }

}