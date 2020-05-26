import React from 'react'

const ContextMain = React.createContext()

const ContextMainProvider = props => {
    // Context state
    const [auth, setAuth] = React.useState({});
    const [filters, setFilters] = React.useState({});
    const [validFilterValues, setValidFilterValues] = React.useState({});

    return (
        <ContextMain.Provider
            value={{
                auth: [auth, setAuth],
                filters: [filters, setFilters],
                validFilterValues: [validFilterValues, setValidFilterValues]
            }}
        >
            {props.children}
        </ContextMain.Provider>
    )
}

export default ContextMain

export { ContextMainProvider }