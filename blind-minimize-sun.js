var blindConfig;

function createOutputMessagePayload(msg) {
    
    const sunOnBlind  = isSunOnBlind(msg.azimuth, msg.elevation);
    const blindPosition = sunOnBlind ? computeBlindPosition(msg.azimuth, msg.elevation) : blindConfig.maxPosition;
    return {
        isSunOnBlind: sunOnBlind,
        blindPosition: blindPosition
    }
}

function computeBlindPosition(sunAzimuth, sunElevation) {
    
    if(sunElevation > 0) {
        const height = Math.tan((sunElevation * Math.PI) / 180) * blindConfig.depth;
        var blindPosition = Math.ceil(100 * (height - blindConfig.bottom) / (blindConfig.top - blindConfig.bottom));
        // Ensure that the position respect the blind.increment
        blindPosition = Math.ceil(blindPosition / blindConfig.increment) * blindConfig.increment;
        // Ensure that the position cannot be more than blind.maxPosition
        blindPosition = Math.min(blindPosition, blindConfig.maxPosition);
        // Ensure that the position cannot be less than blind.minPosition
        blindPosition = Math.max(blindPosition, blindConfig.minPosition);
        return blindPosition;
    }
}

/*
* Function to determine whether the sun is focussing on the blind
* based on the blind orientation the azimuth and elevation of the 
* sun as well as positive and negative blind offsets
*/
function isSunOnBlind(sunAzimuth, sunElevation) {

    if(sunElevation <= 0) {
        return false;
    }
    // compute min and max blind azimuths
    const minAz = mod(blindConfig.orientation - blindConfig.noffset, 360);
    const maxAz = mod(blindConfig.orientation + blindConfig.poffset, 360);
    // rotate all values so that rotatedMinAz = 0 to avoid quadrant check
    const rotatedAzimuth = mod(sunAzimuth - minAz, 360);
    const rotatedMaxAz = mod(maxAz - minAz, 360);
    // rotatedAzimuth should now be included between 0 an rotatedMaxAz
    return rotatedAzimuth < rotatedMaxAz;
}

function mod(n, m) {
    return ((n % m) + m) % m;
}

function isMessageValid(inMsg) {
    // TODO
    return true;
}

function onInputMessage(node, inMsg) {
    if(isMessageValid(inMsg.payload)) {
        const outMsgPayload = createOutputMessagePayload(inMsg.payload);
        node.send(
            {
                topic: "blind-minimize-sun", 
                payload: outMsgPayload
            }
        );
    }
    else {
        // TODO
    }
}

function registerNodes(RED) {
    function createNode(config) {
        blindConfig = config;
        var node = this;
        RED.nodes.createNode(node, config);
        node.on('input', inMsg => onInputMessage(node, inMsg));
    }
    RED.nodes.registerType("blind-minimize-sun", createNode);
}

module.exports = registerNodes;
