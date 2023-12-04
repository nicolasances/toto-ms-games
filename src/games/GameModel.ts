import { ControllerConfig } from "../Config";
import { ExecutionContext } from "../controller/model/ExecutionContext";
import { UserContext } from "../controller/model/UserContext";
import { Logger } from "../logger/TotoLogger";

export interface IGame {}

/**
 * Abstract Class that represent a Toto Game
 */
export abstract class Game implements IGame {

    userEmail: string;
    logger: Logger;
    cid: string | undefined;
    config: ControllerConfig;

    constructor(userContext: UserContext, execContext: ExecutionContext) {

        this.userEmail = userContext.email;
        this.logger = execContext.logger;
        this.cid = execContext.cid;
        this.config = execContext.config as ControllerConfig;

    }

    abstract getGameStatus(): Promise<GameStatus>

    /**
     * Specifies the number of points that the user needs to accumulate in order to achieve "good enough" quality
     * and "pass". 
     * 
     * This is used for the general calculation of the player's progress
     */
    abstract pointsToPass(): number
}

export interface GameStatus {
    score: number               // Current score for the user. Minimum is 0
    maxScore: number            // Maximum achievable score
    percCompletion: number      // Percentage of completion (expresssed as %, e.g. 50), rounded to 0 decimal places. Min is 0.
}