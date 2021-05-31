import React from 'react';

import SimulationDetail from './SimulationDetail';


function SimulationOverview(props) {

    return (
        <div>
            {
                props.simulations.map((sim, index) => {
                    return <SimulationDetail sim={sim} />
                })
            }
        </div>

    )
}

export default SimulationOverview;