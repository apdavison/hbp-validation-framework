/*
A simple two-column table for displaying parameter sets, object properties, etc.
*/

import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';

import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import IconButton from '@material-ui/core/IconButton';

import ImageIcon from '@material-ui/icons/Image';
import ArchiveIcon from '@material-ui/icons/Archive';
import DescriptionIcon from '@material-ui/icons/Description';
import InsertDriveFileIcon from '@material-ui/icons/InsertDriveFile';
import CloudDownloadIcon from '@material-ui/icons/CloudDownload';

const useStyles = makeStyles((theme) => ({
    root: {
      margin: theme.spacing(2)
    },
    item: {
        backgroundColor: "#eeeeee",
        marginBottom: theme.spacing(1)
    }
}));


function FileViewer(props) {
    const { files, title } = props;
    const classes = useStyles();

    return (
        <div className={classes.root}>
            <Typography variant="overline">{title}</Typography>
            <List>
                {
                    files.map((fileObj, index) => {
                        return (
                            <ListItem className={classes.item} key={index} >
                                <ListItemIcon>
                                    <DescriptionIcon fontSize="large"/>
                                </ListItemIcon>
                                <ListItemText primary={fileObj.local_path} secondary={`Digest: ${fileObj.hash}`} />
                                <ListItemSecondaryAction>
                                    <IconButton edge="end" aria-label="download" href={fileObj.download_url} target="_blank">
                                        <CloudDownloadIcon />
                                    </IconButton>
                                </ListItemSecondaryAction>
                            </ListItem>
                        )
                    })
                }
            </List>
        </div>
    )
}

export default FileViewer;
