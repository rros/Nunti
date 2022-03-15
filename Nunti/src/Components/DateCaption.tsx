import React from 'react';

import { 
    Caption,
} from 'react-native-paper';

export default function DateCaption ({ date, lang }) {
    const difference = ((Date.now() - date) / (24*60*60*1000));
    let caption = '';

    if(difference <= 1) { // hours
        const hours = Math.round(difference * 24);
        if(hours == 0){
            caption = lang.just_now;
        } else {
            caption = lang.hours_ago.replace('%time%', hours);
        }
    } else { // days
        caption = lang.days_ago.replace('%time%', Math.round(difference));
    }

    return(
        <Caption>{caption}</Caption>
    );
}
