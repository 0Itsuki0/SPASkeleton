'use client'
import React from 'react';
import {Button, Input, SortDescriptor, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure} from "@nextui-org/react";
import { DynamoEntry, LastEvaluatedKey } from '@/lib/types/dynamoTypes';
import { UserContext } from '@/lib/UserService';
import { deleteEntry, getAll, registerNew, updateEntry } from '@/lib/serverFunctions';
import CustomTable from '@/components/entryTable';
import { XMarkIcon } from '@/icons/xMarkIcon';

enum InputMode {
    New,
    Update
}

export default function Home() {
    const {userId, dispatch} = React.useContext(UserContext)
    const {isOpen: isInputModalOpen, onOpenChange: onInputModalOpenChange, onClose: onInputModalClose} = useDisclosure();
    const {isOpen: isDeleteModalOpen, onOpenChange: onDeleteModalOpenChange, onClose: onDeleteModalClose} = useDisclosure();
    const {isOpen: isTableModalOpen, onOpenChange: onTableModalOpenChange, onClose: onTableModalClose} = useDisclosure();

    const [selectedId, setSelectedId] = React.useState<string|null>(null);


    const [lastKey, setLastKey] = React.useState<LastEvaluatedKey|null>(null)
    const [entries, setEntries] = React.useState<DynamoEntry[]>([])

    const [title, setTitle] = React.useState("")
    const [description, setDescription] = React.useState("")
    const [inputError, setInputError] = React.useState<string|null>(null)

    const [isLoading, setIsLoading] = React.useState(false);

    const [error, setError] = React.useState<string|null>(null);
    const [sortDescriptor, setSortDescriptor] = React.useState<SortDescriptor>({
        column: "lastModified",
        direction: "descending"
    });

    const getInitialEntries = async () => {
        if (userId === null) {
            return
        }
        setIsLoading(true)
        try {
            const [newEntries, newKey] = await getAll(userId, null)
            console.log(`${newEntries.length} jobs fetched. Last key: ${newKey}`)
            setEntries(newEntries)
            setLastKey(newKey)
        } catch (error) {
            setError(`${error}`)
        }
        setIsLoading(false)
    }

    const loadMoreEntries = async () => {
        if (userId === null) {
            return
        }
        setIsLoading(true)

        try {
            const [newEntries, newKey] = await getAll(userId, lastKey)
            console.log(`${newEntries.length} fetched. Last key: ${newKey}`)
            setEntries([...entries, ...newEntries])
            setLastKey(newKey)
        } catch (error) {
            setError(`${error}`)
        }

        setIsLoading(false)
    }

    async function registerNewEntry() {
        if (userId === null) {
            return
        }
        setIsLoading(true)

        try {
            let newEntry = await registerNew(userId, title, description)
            setTitle("")
            setDescription("")
            setEntries([newEntry]);
            onTableModalOpenChange()
        } catch (error) {
            setError(`${error}`)
        }
        setSelectedId(null)
        setIsLoading(false)
    }

    async function updateExisting() {
        console.log("update entry: ", selectedId)
        if (selectedId === null) {
            return
        }
        setIsLoading(true)

        try {
            let newEntry = await updateEntry(selectedId, title, description)
            setEntries((prev) => {
                const entries = prev.filter((v) => v.id != selectedId)
                return [...entries, newEntry]
            });
        } catch (error) {
            setError(`${error}`)
        }
        setSelectedId(null)
        setIsLoading(false)
    }


    async function onDeleteConfirm() {
        console.log("delete entry: ", selectedId)
        if (selectedId === null) {
            return
        }
        setIsLoading(true)

        try {
            await deleteEntry(selectedId)
            setEntries((prev) => {
                const newEntries = prev.filter((v) => v.id != selectedId)
                return newEntries
            });
        } catch (error) {
            setError(`${error}`)
        }
        setSelectedId(null)
        setIsLoading(false)
    }


    const sortedEntries = React.useMemo(() => {
        console.log(sortDescriptor)
        return [...entries].sort((a, b) => {
            const first = (a as any)[sortDescriptor.column as string];
            const second = (b as any)[sortDescriptor.column as string];
            const cmp = first < second ? -1 : first > second ? 1 : 0;

            return sortDescriptor.direction === "descending" ? -cmp : cmp;
        });
    }, [sortDescriptor, entries]);


    React.useEffect(() => {
        if (error !== null) {
            onInputModalClose()
            onTableModalClose()
            onDeleteModalClose()
        }
    }, [error]);

    const inputMode: InputMode = React.useMemo(() => {
        return (title.trim() === "") ? InputMode.New : InputMode.Update
    }, [isInputModalOpen]);


    return (
        <main>
            <div className={`font-mono font-bold text-xl text-center`}>
                ⭐Itsuki SPA Skeleton⭐
            </div>

            {
                (error != null) ?
                <div className={`font-mono text-red-500 font-semibold text-lg text-center`}>
                    {error}
                </div> : <></>
            }

            <Button type="button" color="primary"
                isLoading={isLoading}
                isDisabled={isLoading}
                className='bg-white/90 flex-none text-black/80 w-36'
                onPress={onInputModalOpenChange}
            >
                Register New
            </Button>

            <Button type="button" color="primary"
                isLoading={isLoading}
                isDisabled={isLoading}
                className='bg-white/90 flex-none text-black/80  w-36'
                onPress={ async () => {
                    onTableModalOpenChange()
                    await getInitialEntries()
                }}
            >
                Get All
            </Button>

            <Modal
                size='2xl'
                isOpen={isTableModalOpen}
                onClose={onTableModalClose}
                hideCloseButton={true}
                classNames={{
                    footer: 'justify-between'
                }}
            >
                <ModalContent>
                    {(onClose) => (
                        <>
                        <ModalBody>
                            <div className='flex flex-col'>
                                <div className='flex flex-row justify-items-end justify-end'>
                                    <Button type="button"
                                        className='bg-transparent z-10 text-sm'
                                        style={{'marginTop': '-8px', 'marginBottom': '-4px', 'marginRight': '-24px', }}
                                        onPress={onClose}
                                        isIconOnly
                                    >
                                        <XMarkIcon className="text-black/80 pointer-events-none flex-shrink-0 text-lg fill-black/80" />
                                    </Button>
                                </div>

                                <CustomTable
                                    entries={sortedEntries}
                                    isLoading={isLoading}
                                    onEditPressed={ (entry) => {
                                        setSelectedId(entry.id)
                                        setTitle(entry.title)
                                        setDescription(entry.description)
                                        onInputModalOpenChange()
                                    } }
                                    onDeletePressed={(id) => {
                                        setSelectedId(id)
                                        onDeleteModalOpenChange()
                                    }}
                                    onLoadMorePressed={
                                        lastKey === null ? null :
                                        async () => {
                                            await loadMoreEntries()
                                        }
                                    }
                                    sortDescriptor={sortDescriptor}
                                    setSortDescriptor={setSortDescriptor}
                                />
                            </div>
                        </ModalBody>
                        </>
                    )}
                </ModalContent>
            </Modal>

            <Modal
                size='xs'
                isOpen={isDeleteModalOpen}
                onClose={onDeleteModalClose}
                hideCloseButton={true}
                classNames={{
                    footer: 'justify-between'
                }}
            >
                <ModalContent>
                    {(onClose) => (
                        <>
                        <ModalHeader className="flex flex-col gap-1 text-black/80 text-center">Confirm Deletion</ModalHeader>
                        <ModalBody>
                            <p className='text-black/80 text-center'>
                            Delete Action is not undoable. <br/>
                            Are you sure you want to delete?
                            </p>
                        </ModalBody>
                        <ModalFooter>
                            <Button
                                isDisabled={isLoading}
                                color="danger" variant="light" onPress={onClose}>
                                Cancel
                            </Button>
                            <Button
                                isLoading={isLoading}
                                isDisabled={isLoading}
                                color="danger" onPress={async () => {
                                await onDeleteConfirm()
                                onClose()
                            }}>
                                Delete
                            </Button>
                        </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>


            <Modal
                size='sm'
                isOpen={isInputModalOpen}
                onClose={() => {
                    setTitle("")
                    setDescription("")
                    onInputModalClose()
                }}
                hideCloseButton={true}
                classNames={{
                    footer: 'justify-between'
                }}
            >
                <ModalContent>
                    {(onClose) => (
                        <>
                        <ModalHeader className="flex flex-col gap-1 text-black/80 text-center">
                            {(inputMode == InputMode.New) ? "Register New" : "Update Existing"}
                        </ModalHeader>
                        <ModalBody>
                        <Input
                            autoFocus
                                label="Title"
                                placeholder="Enter a title"
                                variant="bordered"
                                classNames={{
                                    input: [
                                        "bg-transparent",
                                        "text-black/90 dark:text-white/90",
                                        "placeholder:text-default-700/50 dark:placeholder:text-white/60",
                                    ],
                                }}
                                value={title}
                                onValueChange={(str) => {
                                    setInputError(null)
                                    setTitle(str)
                                }}
                            />
                            <Input
                                label="Description"
                                placeholder="Enter a description"
                                variant="bordered"
                                classNames={{
                                    input: [
                                        "bg-transparent",
                                        "text-black/90 dark:text-white/90",
                                        "placeholder:text-default-700/50 dark:placeholder:text-white/60",
                                    ],
                                }}
                                value={description}
                                onValueChange={(str) => {
                                    setInputError(null)
                                    setDescription(str)
                                }}
                            />

                            {
                                (inputError != null) ?
                                <div className={`font-mono text-red-500 font-semibold text-sm text-left ml-1`}>
                                    {inputError}
                                </div>: <></>
                            }

                        </ModalBody>
                        <ModalFooter>
                            <Button
                                isDisabled={isLoading}
                                color="danger" variant="light"
                                onPress={onClose}>
                                Cancel
                            </Button>
                            <Button
                                isLoading={isLoading}
                                isDisabled={isLoading}
                                color="danger" onPress={async () => {
                                if (title.trim() === "" || description.trim() === "") {
                                    setInputError("Title and description are required.")
                                    return
                                }
                                if (inputMode == InputMode.New) {
                                    await registerNewEntry()
                                } else {
                                    await updateExisting()
                                }
                                onClose()
                            }}>
                                {(inputMode == InputMode.New) ? "Register" : "Update"}
                            </Button>
                        </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </main>
    );
}
