import React from 'react';

import { makeStyles } from '@material-ui/core/styles';

import Accordion from '@material-ui/core/Accordion';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import AccordionActions from '@material-ui/core/AccordionActions';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import Typography from '@material-ui/core/Typography';

import { formatAuthors } from "./utils";
import PropertyTable from './PropertyTable';
import FileViewer from './FileViewer';



const useStyles = makeStyles((theme) => ({
    root: {
      minWidth: 275,
      marginBottom: theme.spacing(3)
    },
    heading: {
        flexBasis: '60%',
        flexShrink: 0,
    },
    subheading: {
        textAlign: 'right',
        flex: 1
    }
}));

/*
        configuration: {}
        description
        end_timestamp
        environment
            hardware: "Linux-3.10.0-1062.9.1.el7.x86_64-x86_64-with-centos-7.7.1908-Core"
            name: "lab.ebrains.eu"
            type: "Jupyter Notebook"
            dependencies: [
                { name: "python", version: "3.6.9" }
            ]
        id
        model_instance_id
        outputs
            content_type: "application/vnd.numpy.compressed"
​​​​            download_url: "https://drive.ebrains.eu/f/2dc896fdb09e48438f5f/"
​​​​            file_store: "drive"
​​​​            hash: "091dcbc152721029772f23f82b09ff342a9726c4"
​​​​            id: null
​​​​            local_path: "/mnt/user/drive/My Libraries/My Library/demo_20201123/Vm_long_simulation.npz"
​​​​            size: null
        started_by
            family_name
​​            given_name
        timestamp
        uri
*/

function SimulationDetail(props) {
    const classes = useStyles();
    const { sim } = props;

    return (
        <Accordion className={classes.root}>
            <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel-{sim.id}-content"
            id="panel-{sim.id}-header"
            >

                <Typography variant="subtitle1" className={classes.heading}>
                    {sim.description}
                </Typography>
                <Typography variant="body2" color="textSecondary"  className={classes.subheading}>
                    {sim.timestamp} {formatAuthors([sim.started_by])}
                </Typography>
            </AccordionSummary>
            <AccordionDetails>
                <PropertyTable title="Parameters" rows={Object.entries(sim.configuration)} />
                <PropertyTable title="Dependencies" rows={sim.environment.dependencies.map((dep) => [dep.name, dep.version])} />
                <FileViewer title="Results" files={sim.outputs} />
            </AccordionDetails>
            <AccordionActions>
                <Typography variant="overline" color="textSecondary" gutterBottom>Environment </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                    {sim.environment.type}: {sim.environment.name} ({sim.environment.hardware})
                </Typography>
                <Typography variant="overline" color="textSecondary" gutterBottom>ID </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                    {sim.id}
                </Typography>
            </AccordionActions>
      </Accordion>
      );

}

export default SimulationDetail;