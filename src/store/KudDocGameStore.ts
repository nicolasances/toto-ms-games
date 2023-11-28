import { Db } from "mongodb";
import { Games } from '../games/Games';
import { ControllerConfig } from "../Config";

const f_email = "user"
const f_gameId = "gameId"
const f_kuds = "kuds"

const f_kud_id = "kudId"
const f_kud_status = "status"

export class KudDocGameStore {

    db: Db;
    config: ControllerConfig;

    constructor(db: Db, config: ControllerConfig) {
        this.db = db;
        this.config = config;
    }

    /**
     * Retrieves the Kud Documents that have been uploaded by the user
     * @param userEmail the user email
     * @returns a list of kud document ids
     */
    async getKuds(userEmail: string) {

        const game = await this.db.collection(this.config.getCollections().games).findOne({ [f_email]: userEmail, [f_gameId]: Games.kudDocUploadGame.id }) as unknown as KudDocGamePO;

        if (game == null) return []

        return game[f_kuds];

    }
}

interface KudDocGamePO {

    [f_email]: string
    [f_gameId]: string
    [f_kuds]: KudPO[]

}

interface KudPO {
    
    [f_kud_id]: string  // A kud id will have the form "kud-year-month"
    [f_kud_status]: string

}