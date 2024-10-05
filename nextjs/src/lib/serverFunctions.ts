'use server'

import { objectToCamel } from "ts-case-convert"
import { DynamoEntry, LastEvaluatedKey } from "./types/dynamoTypes"

const endpoint: string = process.env.API_ENDPOINT ?? ""

export async function getSingle(id: string): Promise<DynamoEntry> {
    if (!checkEndpoint()) {
        throw Error('endpoint not available')
    }

    const url = new URL(`${endpoint}events/${id}`)
    const response = await fetch(url)
    const responseJson = await response.json()
    console.log(responseJson)

    if (!response.ok) {
        throw Error(responseJson.message ?? "Unknwon Error")
    }

    const entry: DynamoEntry = objectToCamel(responseJson) as DynamoEntry
    return entry
}


export async function registerNew(userId: string, title: string, description: string): Promise<DynamoEntry>{
    if (!checkEndpoint()) {
        throw Error('endpoint not available')
    }

    const url = new URL(`${endpoint}entries`)

    const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            user_id: userId,
            title: title,
            description: description,
        })
    }

    const response = await fetch(url, options)
    const responseJson = await response.json()
    console.log(responseJson)

    if (!response.ok) {
        throw Error(responseJson.message ?? "Unknwon Error")
    }

    const entry: DynamoEntry = objectToCamel(responseJson) as DynamoEntry
    return entry
}

export async function updateEntry(id: string, title: string, description: string): Promise<DynamoEntry> {
    if (!checkEndpoint()) {
        throw Error('endpoint not available')
    }
    const options = {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            title: title,
            description: description,
        })
    }
    const url = new URL(`${endpoint}entries/${id}`)
    const response = await fetch(url, options)
    const responseJson = await response.json()
    console.log(responseJson)

    if (!response.ok) {
        throw Error(responseJson.message ?? "Unknwon Error")
    }

    const entry: DynamoEntry = objectToCamel(responseJson) as DynamoEntry
    return entry
}


export async function deleteEntry(id: string) {
    if (!checkEndpoint()) {
        throw Error('endpoint not available')
    }
    const options = {
        method: 'DELETE',
    }
    const url = new URL(`${endpoint}entries/${id}`)
    const response = await fetch(url, options)
    const responseJson = await response.json()
    console.log(responseJson)

    if (!response.ok) {
        throw Error(responseJson.message ?? "Unknwon Error")
    }
    return
}


export async function getAll(userId: string, lastEvaluatedKey: LastEvaluatedKey|null): Promise<[DynamoEntry[], LastEvaluatedKey|null]> {
    if (!checkEndpoint) {
        throw Error('endpoint not available')
    }
    var options = {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    }
    var url = new URL(`${endpoint}entries`)
    url.searchParams.append('user_id', userId);

    if (lastEvaluatedKey != null) {
        url.searchParams.append('id', lastEvaluatedKey.id);
        url.searchParams.append('last_modified', lastEvaluatedKey.lastModified.toString());
    }

    const response = await fetch(url, options)
    const responseJson = await response.json()
    console.log(responseJson)
    if (!response.ok) {
        throw Error(responseJson.message ?? "Unknwon Error")
    }

    const entries: DynamoEntry[] = objectToCamel(responseJson.entries) as DynamoEntry[]
    const newLastEvaluatedKey: LastEvaluatedKey|null = objectToCamel(responseJson.last_evaluated_key) as LastEvaluatedKey|null
    console.log(entries)
    return [entries, newLastEvaluatedKey]
}


function checkEndpoint(): boolean {
    return (endpoint !== "")
}