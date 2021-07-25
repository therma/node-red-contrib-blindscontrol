var lastSunMsg;
var lastWeatherMsg;
var lastTimerMessage;
var blindsConfig = [];

const blindsCurrentPosition = {};
const messageMapper = {
    
    blindConfig: inMsg => {
        blindsConfig = blindsConfig.filter(config => config.channel !== inMsg.payload.channel);
        blindsConfig.push(inMsg.payload)
        delete blindsCurrentPosition[inMsg.payload.channel];
        return undefined;
    },

    blindConfigUpdate: inMsg => {
        blindsConfig
            .filter(config => config.channel === inMsg.payload.channel)
            .forEach(config => Object.assign(config, inMsg.payload))
        delete blindsCurrentPosition[inMsg.payload.channel];
        return undefined;
    },

    sun: inMsg => {
        lastSunMsg = inMsg.payload;
        return createOutputMessagesPayloads();
    },

    weather: inMsg => {
        lastWeatherMsg = inMsg.payload;
        return createOutputMessagesPayloads();
    },

    timer: inMsg => {
        lastTimerMessage = inMsg.payload;
        return createOutputMessagesPayloads();
    }
}

function createOutputMessagesPayloads() {
    return blindsConfig
            .filter(blindConfig => blindConfig.enabled)
            .map(blindConfig => createOutputMessagePayload(lastSunMsg, lastWeatherMsg, lastTimerMessage, blindConfig))
            .filter(blindPositionChanged)
}

function createOutputMessagePayload(inSunMsg, inWeatherMsg, inTimerMsg, blindConfig) {
    
    var blindPosition = Math.min(
        computeBlindPositionBasedOnSun(blindConfig, inSunMsg.azimuth, inSunMsg.elevation),
        computeBlindPositionBasedOnWeather(blindConfig),
        computeBlindPositionBasedOnTimer(blindConfig)
    );
    // Ensure that the position respect the blind.increment
    blindPosition = Math.ceil(blindPosition / blindConfig.increment) * blindConfig.increment;
    // Ensure that the position cannot be more than blind.maxPosition
    blindPosition = Math.min(blindPosition, blindConfig.maxPosition);
    // Ensure that the position cannot be less than blind.minPosition
    blindPosition = Math.max(blindPosition, blindConfig.minPosition);
    return {
        channel: blindConfig.channel,
        blindPosition: blindPosition
    }
}

function blindPositionChanged(outMsg) {

    if(blindsCurrentPosition[outMsg.channel] === undefined 
    || outMsg.blindPosition !== blindsCurrentPosition[outMsg.channel]) {
        blindsCurrentPosition[outMsg.channel] = outMsg.blindPosition;
        return true;
    }
    return false;
}

function computeBlindPositionBasedOnSun(blindConfig, azimuth, elevation) {
    
    if(!azimuth || !elevation) {
        return blindConfig.maxPosition;
    }
    if(blindConfig.mode === 'minimize-sun' && isSunOnBlind(blindConfig, azimuth, elevation)) {
        const height = Math.tan((elevation * Math.PI) / 180) * blindConfig.depth;
        return Math.ceil(100 * (height - blindConfig.bottom) / (blindConfig.top - blindConfig.bottom));
    }
    else {
        return elevation > blindConfig.minElevation ? 
                    blindConfig.maxPosition : 
                    blindConfig.minPosition;
    }
}

function computeBlindPositionBasedOnWeather(blindConfig) {

    // TODO
    return blindConfig.maxPosition;
}

function computeBlindPositionBasedOnTimer(blindConfig) {

    // TODO
    return blindConfig.maxPosition;
}

/*
* Function to determine whether the sun is focussing on the blind
* based on the blind orientation the azimuth and elevation of the 
* sun as well as positive and negative blind offsets
*/
function isSunOnBlind(blindConfig, sunAzimuth, sunElevation) {

    // compute min and max blind azimuths
    const minAz = mod(blindConfig.orientation - blindConfig.noffset, 360);
    const maxAz = mod(blindConfig.orientation + blindConfig.poffset, 360);
    // rotate all values so that rotatedMinAz = 0 to avoid quadrant check
    const rotatedAzimuth = mod(sunAzimuth - minAz, 360);
    const rotatedMaxAz = mod(maxAz - minAz, 360);
    // rotatedAzimuth should now be included between 0 an rotatedMaxAz
    return sunElevation > blindConfig.minElevation && rotatedAzimuth < rotatedMaxAz;
}

function mod(n, m) {
    return ((n % m) + m) % m;
}

function isMessageValid(inMsg) {
    return true;
}

function onInputMessage(node, inMsg) {
    if(isMessageValid(inMsg)) {
        const outputMessagesPayloads = messageMapper[inMsg.topic](inMsg);
        if(Array.isArray(outputMessagesPayloads)) {
            outputMessagesPayloads.forEach(payload => node.send({topic: "blind", payload: payload}))
        }
    }
}

function registerNodes(RED) {
    function createBlindsControlNode(config) {
        var node = this;
        RED.nodes.createNode(node, config);
        node.on('input', inMsg => onInputMessage(node, inMsg));
    }
    RED.nodes.registerType("blinds-control", createBlindsControlNode);
}

module.exports = registerNodes;
