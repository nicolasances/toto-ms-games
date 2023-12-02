import { Db } from "mongodb";
import { Games } from '../games/Games';
import { ControllerConfig } from "../Config";

// Generic game data, valid for any type of game
const f_email = "user"
const f_gameId = "gameId"
const f_kuds = "kuds"

// Kud Doc Specific data
const f_kud_id = "kudId"
const f_kud_status = "status"   // Valid kud statuses are "uploaded", "processed"

export class KudDocGameStore {

    db: Db;
    config: ControllerConfig;

    constructor(db: Db, config: ControllerConfig) {
        this.db = db;
        this.config = config;
    }

    /**
     * Retrieves the Game information and status (complete dataset)
     * @param userEmail the user email
     */
    async getGame(userEmail: string): Promise<KuploadGamePO> {

        const game = await this.db.collection(this.config.getCollections().games).findOne({ [f_email]: userEmail, [f_gameId]: Games.kupload.id }) as unknown as KuploadGamePO;

        return game

    }

    /**
     * Retrieves the Kud Documents that have been uploaded by the user
     * @param userEmail the user email
     * @returns a list of kud document ids
     */
    async getKuds(userEmail: string) {

        const game = await this.db.collection(this.config.getCollections().games).findOne({ [f_email]: userEmail, [f_gameId]: Games.kupload.id }) as unknown as KuploadGamePO;

        if (game == null) return []

        return game[f_kuds];

    }

    /**
     * Creates a kud entry in the game, with status "uploaded"
     * @param userEmail user email
     * @param kudId id of the uploaded kud (format kud-year-month)
     */
    async onKudUploaded(userEmail: string, kudId: string) {

        const gameFilter = {
            [f_email]: userEmail,
            [f_gameId]: Games.kupload.id,
        }

        const clear = {
            $pull: {
                [f_kuds]: {
                    [f_kud_id]: kudId
                }
            }
        }

        const update = {
            $push: {
                [f_kuds]: {
                    [f_kud_id]: kudId,
                    [f_kud_status]: KudStatus.uploaded
                }
            }
        }

        // Make sure to delete any previously inserted kud with the same kudId
        await this.db.collection(this.config.getCollections().games).updateOne(gameFilter, clear, { upsert: true })

        // Now recreate that kud
        await this.db.collection(this.config.getCollections().games).updateOne(gameFilter, update, { upsert: true })

    }

    /**
     * Updates the status of a kud as specified
     * @param userEmail user email
     * @param kudId id of the uploaded Kud (remember kud Ids are in the format "kud-year-month")
     * @param status one of KudStatus
     */
    async updateKudStatus(userEmail: string, kudId: string, status: string) {

        const gameFilter = {
            [f_email]: userEmail,
            [f_gameId]: Games.kupload.id,
            [`${f_kuds}.${f_kud_id}`]: kudId
        }

        const update = {
            $set: {
                [`${f_kuds}.$.${f_kud_status}`]: status
            }
        }

        await this.db.collection(this.config.getCollections().games).updateOne(gameFilter, update, { upsert: true })

    }

}

export interface KuploadGamePO {

    [f_email]: string
    [f_gameId]: string
    [f_kuds]: KudPO[]

}

export interface KudPO {

    [f_kud_id]: string  // A kud id will have the form "kud-year-month"
    [f_kud_status]: string

}

export const KudStatus = {
    uploaded: "uploaded",
    processed: "processed",
}