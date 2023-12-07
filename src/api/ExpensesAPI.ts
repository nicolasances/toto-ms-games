import http from 'request'
import { ExecutionContext } from "../controller/model/ExecutionContext";
import { UserContext } from "../controller/model/UserContext";

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
}

export interface GetExpensesResponse {
    expenses: TotoExpense[]
}

export interface TotoExpense {
    id: string,
    amount: number,
    amountInEuro: number,
    category: string,
    date: number,
    description: string,
    yearMonth: string,
    consolidated: boolean,
    currency: string,
    user: string,
    monthly: boolean,
    tags?: string[]
}