import http from 'request'
import moment from 'moment-timezone';
import { ExecutionContext } from "toto-api-controller/dist/model/ExecutionContext";
import { UserContext } from "toto-api-controller/dist/model/UserContext";

export class ExpensesAPI {

    endpoint: string;
    userEmail: string;
    cid: string;
    authorizationHeader: string;

    constructor(userContext: UserContext, execContext: ExecutionContext, authorizationHeader: string) {
        this.endpoint = process.env["EXPENSES_API_ENDPOINT"]!
        this.userEmail = userContext.email
        this.cid = String(execContext.cid);
        this.authorizationHeader = authorizationHeader;
    }

    async getExpenses(yearMonth: string): Promise<GetExpensesResponse> {

        return new Promise((success, failure) => {

            http({
                uri: this.endpoint + `/expenses?user=${this.userEmail}&yearMonth=${yearMonth}`,
                method: 'GET',
                headers: {
                    'x-correlation-id': this.cid,
                    'Authorization': this.authorizationHeader
                }
            }, (err: any, resp: any, body: any) => {

                if (err) {
                    console.log(err)
                    failure(err);
                }
                else success(JSON.parse(body));

            })
        })
    }

    /**
     * Retrieves the incomes of the specified yearMonth
     * 
     * @param yearMonth the yearmonth to consider
     * @returns the incomes of that year month
     */
    async getIncomes(yearMonth: string): Promise<GetIncomesResponse> {

        return new Promise((success, failure) => {

            http({
                uri: this.endpoint + `/incomes?yearMonth=${yearMonth}`,
                method: 'GET',
                headers: {
                    'x-correlation-id': this.cid,
                    'Authorization': this.authorizationHeader
                }
            }, (err: any, resp: any, body: any) => {

                if (err) {
                    console.log(err)
                    failure(err);
                }
                else success(JSON.parse(body));

            })
        })
    }

    async consolidateExpense(expenseId: string) {

        return new Promise((success, failure) => {

            http({
                uri: this.endpoint + `/expenses/${expenseId}`,
                method: 'PUT',
                headers: {
                    'x-correlation-id': this.cid,
                    'Authorization': this.authorizationHeader,
                    'Content-Type': "application/json",
                },
                body: JSON.stringify({
                    consolidated: true
                })
            }, (err: any, resp: any, body: any) => {

                if (err) {
                    console.log(err)
                    failure(err);
                }
                else success({});

            })
        })

    }

    /**
     * Updates the expense's category
     * 
     * @param expenseId the id of the expense to be updated
     * @param category the new category
     */
    async updateExpenseCategory(expenseId: string, category: string) {

        return new Promise((success, failure) => {

            http({
                uri: this.endpoint + `/expenses/${expenseId}`,
                method: 'PUT',
                headers: {
                    'x-correlation-id': this.cid,
                    'Authorization': this.authorizationHeader,
                    'Content-Type': "application/json",
                },
                body: JSON.stringify({
                    category: category
                })
            }, (err: any, resp: any, body: any) => {

                if (err) {
                    console.log(err)
                    failure(err);
                }
                else success({});

            })
        })

    }

    /**
     * POSTs the expense to the Expenses API
     * 
     * @param expense the expense to POST
     * @returns an expense id
     */
    async postExpense(expense: TotoExpense): Promise<PostExpenseResult> {

        return new Promise((success, failure) => {

            http({
                uri: this.endpoint + `/expenses`,
                method: 'POST',
                headers: {
                    'x-correlation-id': this.cid,
                    'Authorization': this.authorizationHeader,
                    'Content-Type': "application/json",
                },
                body: JSON.stringify(expense)
            }, (err: any, resp: any, body: any) => {

                if (err) {
                    console.log(err)
                    failure(err);
                }
                else success(JSON.parse(body))

            })
        })

    }
}

export interface PostExpenseResult {
    id: string
}

export interface GetExpensesResponse {
    expenses: TotoExpense[]
}
export interface GetIncomesResponse {
    incomes: TotoIncome[]
}

export class TotoIncome {

    id?: string
    amount: number
    currency: string
    category: string 
    rateToEur?: number
    amountInEuro?: number
    date: string
    description: string
    yearMonth: number
    consolidated: boolean = false
    user: string

    constructor(amount: number, date: string, description: string, currency: string, user: string, category: string) {

        this.amount = amount
        this.date = date
        this.description = description
        this.currency = currency
        this.user = user
        this.category = category

        // Set the year month
        this.yearMonth = parseInt(moment(date, "YYYYMMDD").format("YYYYMM"))

    }

}

export class TotoExpense {

    id?: string
    amount: number
    amountInEuro?: number
    category?: string
    date: string
    description: string
    yearMonth?: number
    consolidated: boolean = false
    currency: string
    user: string
    monthly: boolean = false
    tags: string[] = []

    constructor(amount: number, date: string, description: string, currency: string, user: string, category?: string) {

        this.amount = amount
        this.date = date
        this.description = description
        this.currency = currency
        this.user = user

        // Set the year month
        this.yearMonth = parseInt(moment(date, "YYYYMMDD").format("YYYYMM"))

    }

}

