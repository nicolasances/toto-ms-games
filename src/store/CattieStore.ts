import { Db } from "mongodb";
import { Games } from '../games/Games';
import { ControllerConfig } from "../Config";
import { TotoExpense } from "../api/ExpensesAPI";
import moment from "moment-timezone";

const f_expenseId = "expenseId"
const f_description = "description"
const f_amount = "amount"
const f_currency = "currency"
const f_date = "date"
const f_originalCategory = "originalCategory"
const f_chosenCategory = "chosenCategory"
const f_chosenOn = "chosenOn"
const f_user = "user"

export class CattieStore {

    db: Db;
    config: ControllerConfig;

    constructor(db: Db, config: ControllerConfig) {
        this.db = db;
        this.config = config;
    }

    async saveCategoryPick(userEmail: string, expense: TotoExpense, chosenCategory: string): Promise<SaveCategoryPickResult> {

        // Create the Cattie Record to save
        const cattieRecord = new CattieRecord(expense.id!, expense.description, expense.amount, expense.currency, expense.date, expense.category!, chosenCategory, moment().tz("Europe/Rome").format("YYYYMMDD"), userEmail)

        // Make sure to delete any previously inserted kud with the same kudId
        const result = await this.db.collection(this.config.getCollections().cattie).insertOne(cattieRecord)

        // Return the insertion result 
        return { insertedId: result.insertedId.toHexString() }
    }

}

export class CattieRecord {

    [f_expenseId]: string
    [f_description]: string
    [f_amount]: number
    [f_currency]: string
    [f_date]: string
    [f_originalCategory]: string
    [f_chosenCategory]: string
    [f_chosenOn]: string
    [f_user]: string

    constructor(eid: string, desc: string, amt: number, curr: string, date: string, originalCat: string, chosenCat: string, chosenOn: string, user: string) {
        this[f_expenseId] = eid
        this[f_description] = desc
        this[f_amount] = amt
        this[f_currency] = curr
        this[f_date] = date
        this[f_originalCategory] = originalCat
        this[f_chosenCategory] = chosenCat
        this[f_chosenOn] = chosenOn
        this[f_user] = user
    }
}

export interface SaveCategoryPickResult {
    insertedId: string
}