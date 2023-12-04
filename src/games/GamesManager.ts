import { ExecutionContext } from "../controller/model/ExecutionContext";
import { UserContext } from "../controller/model/UserContext";
import { Game, GameStatus } from "./GameModel";
import { Games } from "./Games";
import { KuploadGame } from "./kud/KuploadGame";

/**
 * This class manages the overview of all Games
 */
export class GamesManager {

    userContext: UserContext;
    execContext: ExecutionContext;

    constructor(userContext: UserContext, execContext: ExecutionContext) {

        this.userContext = userContext;
        this.execContext = execContext;

    }

    /**
     * Retrieves the overview of all games.
     * 
     * What the Overview provides is: 
     *  - The score of each game
     *  - The overall level of the player
     */
    async getGamesOverview(): Promise<GamesOverview> {

        // Get the score from each game
        const gameStatuses: SingleGameOverview[] = []

        for (let gameKey of Object.keys(Games)) {

            // Get the Game Manager's class name
            const gameConstructor = Games[gameKey].newManager;

            if (gameConstructor) {

                // Instantiate the Game's Manager
                const game = gameConstructor(this.userContext, this.execContext);

                // Get the Game Status
                const gameStatus = await game.getGameStatus();

                // Store the status
                gameStatuses.push({
                    gameKey: gameKey,
                    gameStatus: gameStatus
                })
            }

        }

        // Calculate the overall level of the player
        const playerLevel = this.getPlayerLevel(gameStatuses)

        return {
            playerLevel: playerLevel,
            gamesStatuses: gameStatuses
        }

    }

    /**
     * Calculates the Player's score based on the status of each game
     * 
     * @param gameStatuses a list containing the status of each game
     */
    getPlayerLevel(gameStatuses: SingleGameOverview[]): PlayerLevel {

        // Get the player progress
        const progress = this.getPlayerProgress(gameStatuses);

        // Level 0: FISHY
        if (progress.score < new KuploadGame(this.userContext, this.execContext).pointsToPass()) return new PlayerLevel(PlayerLevels.fishy, progress);

        // Level 1: MONKEY
        return new PlayerLevel(PlayerLevels.monkey, progress);

        // Level 2: CAKE

        // Level 3: BIRDIE

        // Level 4: ROBOT

        // Level 5: ROCKET

    }

    /**
     * Calculates the player's overall progress as a "points" score
     * 
     * @param gameStatuses the list of every game's status
     */
    getPlayerProgress(gameStatuses: SingleGameOverview[]) {

        let score = 0;
        let maxScore = 0;

        for (let status of gameStatuses) {

            score += status.gameStatus.score;
            maxScore += status.gameStatus.maxScore;

        }

        const percCompletion = (100 * score) / maxScore;

        return { score: score, maxScore: maxScore, percCompletion: percCompletion }

    }

}

/**
 * Player Levels that are currently managed in Toto!
 */
export const PlayerLevels = {
    fishy: {
        id: "fishy",
        title: "Fishy",
        desc: "It stinks a bit.. Your data is underwater.. You get the point, you need to start playing games to clean it all up and get your data quality up!",
    } as Level,
    monkey: {
        id: "monkey",
        title: "Monkey",
        desc: "A monkey could have been taking care of your data, for what I know. But it's a bit better than before! So keep paying that monkey to play games!",
    } as Level
}

interface Level {
    id: string,
    desc: string
}

interface SingleGameOverview {
    gameKey: string,
    gameStatus: GameStatus
}

interface PlayerProgress {
    score: number, 
    maxScore: number, 
    percCompletion: number
}

export class PlayerLevel {

    level: Level;
    progress: PlayerProgress;

    constructor(level: Level, progress: PlayerProgress) {
        this.level = level
        this.progress = progress;
    }
}

interface GamesOverview {

    playerLevel: PlayerLevel,
    gamesStatuses: SingleGameOverview[]

}