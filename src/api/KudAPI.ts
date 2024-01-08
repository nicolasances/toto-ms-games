import http from 'request'
import { TotoExpense } from './ExpensesAPI';
import { ExecutionContext } from "toto-api-controller/dist/model/ExecutionContext";
import { UserContext } from "toto-api-controller/dist/model/UserContext";

export class KudAPI {

    endpoint: string;
    userEmail: string;
    cid: string;
    authorizationHeader: string;

    constructor(userContext: UserContext, execContext: ExecutionContext, authorizationHeader: string) {
        this.endpoint = process.env["KUD_API_ENDPOINT"]!
        this.userEmail = userContext.email
        this.cid = String(execContext.cid);
        this.authorizationHeader = authorizationHeader;
    }

    /**
     * Retrieves the next unreconciled transaction
     * @param skipTransactions number of transactions to skip
     * @returns 
     */
    async getUnreconciledTransaction(skipTransactions: number): Promise<GetKudTransactionsResponse> {

        // Calculate the number of transactions to extract
        // The number depends from skipTransactions: if skipTransactions > 0, then retrieve (1 + skipTransactions) transactions
        const maxResults = skipTransactions + 1

        return new Promise((success, failure) => {

            http({
                uri: this.endpoint + `/transactions?user=${this.userEmail}&transactionType=payment&maxResults=${maxResults}`,
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
     * Counts the kud transactions (total, not just the non-reconciled)
     * @returns Promise<CountKudTransactionsResponse> the count
     */
    async countKudTransactions(): Promise<CountKudTransactionsResponse> {

        return new Promise((success, failure) => {

            http({
                uri: this.endpoint + `/transactions/count?user=${this.userEmail}`,
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
     * Retrieves the reconciliations from the Kud API, for a given user and yearMonth
     * 
     * @param yearMonth the year month to consider
     */
    async getReconciliations(yearMonth: string): Promise<GetReconciliationsResponse> {

        return new Promise((success, failure) => {

            http({
                uri: this.endpoint + `/reconciliations?user=${this.userEmail}&yearMonth=${yearMonth}`,
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

    async postReconciliation(kudTransaction: KudTransaction, totoExpense: TotoExpense) {

        return new Promise((success, failure) => {

            http({
                uri: this.endpoint + `/reconciliations`,
                method: 'POST',
                headers: {
                    'x-correlation-id': this.cid,
                    'Authorization': this.authorizationHeader,
                    'Content-Type': "application/json",
                },
                body: JSON.stringify({
                    kudPayment: kudTransaction,
                    totoTransaction: totoExpense
                })
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
     * Invalidates the specified Kud Transaction
     * 
     * @param kudTransactionId the id of the transaction to invalidate
     * @returns 
     */
    async invalidateKudTransaction(kudTransactionId: string) {

        return new Promise((success, failure) => {

            http({
                uri: this.endpoint + `/transactions/invalidate`,
                method: 'POST',
                headers: {
                    'x-correlation-id': this.cid,
                    'Authorization': this.authorizationHeader,
                    'Content-Type': "application/json",
                },
                body: JSON.stringify({
                    kudTransactionId: kudTransactionId
                })
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
     * Counts the reconciliations
     * @returns Promise<CountReconciliationsResponse> the count
     */
    async countReconciliations(): Promise<CountReconciliationsResponse> {

        return new Promise((success, failure) => {

            http({
                uri: this.endpoint + `/reconciliations/count?user=${this.userEmail}`,
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
}


export interface KudTransaction {
    amount: number,
    date: string,
    id: string,
    kudId: string,
    text: string,
    user: string,
    yearMonth: string
}

export interface GetKudTransactionsResponse {
    payments: KudTransaction[]
}

export interface ReconciliationKudPayment {
    amount: number,
    date: string,
    id: string,
    kudId: string,
    text: string,
    user: string,
    year_month: string
}
export interface ReconciliationTotoExpense {
    amount: number,
    date: string,
    id: string,
    text: string,
    year_month: number
}
/**
 * Reconciliation as exposed by the Kud API
 */
export interface Reconciliation {

    id: string, 
    kud_payment: ReconciliationKudPayment, 
    toto_expense: ReconciliationTotoExpense

}
export interface GetReconciliationsResponse {
    reconciliations: Reconciliation[]
}
export interface CountKudTransactionsResponse {
    count: number
}
export interface CountReconciliationsResponse {
    reconciliationCount: number
}