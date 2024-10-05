'use client'
import React from 'react'
import {SortDescriptor, Button, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Tooltip} from "@nextui-org/react"

import { TrashIcon } from '@/icons/trashIcon'
import { DynamoEntry } from '@/lib/types/dynamoTypes'
import { PenIcon } from '@/icons/penIcon'


interface TableProps {
    entries: DynamoEntry[],
    isLoading: boolean,
    onEditPressed: (entry: DynamoEntry) => void,
    onDeletePressed: (id: string) => void,
    onLoadMorePressed: (() => void) | null
    sortDescriptor: SortDescriptor,
    setSortDescriptor: React.Dispatch<React.SetStateAction<SortDescriptor>>
}


export default function EntryTable(
    {
        entries,
        isLoading,
        onEditPressed,
        onDeletePressed,
        onLoadMorePressed,
        sortDescriptor,
        setSortDescriptor,
    }: TableProps
)  {

    var columns = [
        {
            key: "title",
            label: "Title",
        },
        {
            key: "description",
            label: "Description",
            sortable: true
        },
        {
            key: "lastModified",
            label: "Last Modified",
            sortable: true
        },
        {
            key: "editActions",
            label: "",
        }
    ]

    const renderCell = React.useCallback((entry: DynamoEntry, columnKey: React.Key) => {
        switch (columnKey) {
            case 'title':
                return (
                    <div className=''>
                        {entry.title}
                    </div>
                )
            case 'description':
                return (
                    <div className=''>
                        {entry.description}
                    </div>
                )
            case 'lastModified':
                return (
                    <div className=''>
                        {new Date(entry.lastModified*1000).toLocaleString()}
                    </div>
                )

            case 'editActions':
                return (
                    <div className='flex flex-row justify-center gap-2'>
                        <Button type="button" color="primary"
                            isLoading={isLoading}
                            isDisabled={isLoading}
                            size='sm'
                            isIconOnly
                            className='flex-none text-md text-white/90 bg-green-500 '
                            onPress={() => {
                                onEditPressed(entry)
                            }}
                        >
                            <PenIcon className="pointer-events-none flex-shrink-0 fill-white/80" />
                        </Button>

                        <Button type="button" color="primary"
                            size='sm'
                            isIconOnly
                            className='flex-none text-lg text-white/90 bg-red-500'
                            onPress={() => {
                                onDeletePressed(entry.id)
                            }}
                        >
                            <TrashIcon className="pointer-events-none flex-shrink-0" />
                        </Button>
                    </div>

                )
            default:
                return (
                    <div className=''></div>
                )
        }
    }, [isLoading])


    return (

        <Table
            aria-label="Table"
            isHeaderSticky={true}
            classNames={{
                base: 'font-mono',
                th: 'hover:cursor-default',
                tr: `hover:bg-gray-200`,
                td: `text-black/50 max-w-64 text-ellipsis overflow-hidden whitespace-nowrap`,
                emptyWrapper: `h-12`
            }}
            sortDescriptor={sortDescriptor}
            onSortChange={setSortDescriptor}
            bottomContent={
                onLoadMorePressed !== null && !isLoading ? (
                  <div className="flex w-full justify-center">
                    <Button
                        isDisabled={isLoading}
                        isLoading={isLoading}
                        onPress={onLoadMorePressed}>
                        Load More
                    </Button>
                  </div>
                ) : null
              }
        >
            <TableHeader columns={columns}>
                {(column) => (
                    <TableColumn key={column.key} allowsSorting={column.sortable}>
                        {column.label}
                    </TableColumn>
                )}
            </TableHeader>

            <TableBody
                items={entries}
                isLoading={isLoading}
                emptyContent="No results to display."
                loadingContent="Loading..."
            >
                {(item) => (
                    <TableRow key={item.id}>
                        {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                    </TableRow>
                )}
            </TableBody>
        </Table>
    )
}
