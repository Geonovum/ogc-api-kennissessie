import proj4 from 'proj4'
import { point as _point, bboxPolygon } from '@turf/turf'
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const PROJS = require("./projs.json");

const getProjByCode = function(code){
    for (let i = 0; i < PROJS.length; i++){
        if(PROJS[i]['code'] == code){
            return PROJS[i];
        }
    }
    return undefined // code does not exist
}

const projectPoint = function(point, fromProj4, toProj4, digits = null){
    let res = proj4(fromProj4,toProj4,point)
    if (digits){
        res[0] =  parseFloat(res[0].toFixed(digits));
        res[1] =  parseFloat(res[1].toFixed(digits));
    }
    return res;
}

const projectRing = function(points, fromProj4, toProj4, digits = null){ // Linestring, MultiPoint?
    for (let i = 0; i < points.length; i++){
        points[i] = projectPoint(points[i], fromProj4,toProj4, digits)
    }
    return points;
}

const projectRings = function(rings, fromProj4, toProj4, digits = null){ //MultiLinestring, Polygon
    for (let i = 0; i < rings.length; i++){
        rings[i] = projectRing(rings[i], fromProj4,toProj4, digits)
    }
    return rings;
}

const projectMultiRings = function(multiRings, fromProj4, toProj4, digits = null){ // MultiPolygon
    for (let i = 0; i < multiRings.length; i++){
        multiRings[i] = projectRings(multiRings[i], fromProj4,toProj4, digits)
    }
    return multiRings;
}

const _projectFeature = function(feature, fromProj4, toProj4, digits = null){
    if (!feature){
        return
    }
    if (!feature.geometry){
        return;
    }
    if (!feature.geometry.type){
        return;
    }
    
    if( feature.geometry.type === 'Point'){
        feature.geometry.coordinates = projectPoint(feature.geometry.coordinates ,fromProj4, toProj4, digits )
    } else if ( feature.geometry.type === 'MultiPoint' || feature.geometry.type === 'LineString'){
        feature.geometry.coordinates = projectRing(feature.geometry.coordinates ,fromProj4, toProj4, digits )
    } else if ( feature.geometry.type === 'MultiLineString' || feature.geometry.type === 'Polygon'){
        feature.geometry.coordinates = projectRings(feature.geometry.coordinates ,fromProj4, toProj4, digits )
    } else if ( feature.geometry.type === 'MultiPolygon'){
        feature.geometry.coordinates = projectMultiRings(feature.geometry.coordinates ,fromProj4, toProj4, digits )
    } else {
        console.log( 'unsupported geometry type')
    }
    return feature;
}

const projectFeature = function(feature, codeSridFrom, codeSridTo, digits = null){

    if (codeSridFrom == codeSridTo) return feature

    const fromProjection = getProjByCode(codeSridFrom)
    if (fromProjection == undefined) return
    const fromProj = fromProjection['proj4']
    const toProjection = getProjByCode(codeSridTo)
    if (toProjection == undefined) return
    const toProjec = toProjection['proj4']
    if (!fromProjection || !toProjection)
        return

    return _projectFeature(feature, fromProj, toProjec, digits)
}

const projectFeatureCollection = function(_features, codeSridFrom, codeSridTo, digits = null) {

    if (codeSridFrom == codeSridTo) return _features

    const fromProjection = getProjByCode(codeSridFrom)
    if (fromProjection == undefined) return
    const fromProj = fromProjection['proj4']
    const toProjection = getProjByCode(codeSridTo)
    if (toProjection == undefined) return
    const toProjec = toProjection['proj4']
    if (!fromProjection || !toProjection)
        return

    let features = JSON.parse(JSON.stringify(_features));
    for (let i = 0; i < features.length; i++){
        const newFeat =  _projectFeature(features[i], fromProj, toProjec, digits);
        if (newFeat){
            features[i] = newFeat;
        }
        
    }
    return features;
}

const projectBBox = function(featureBBox, codeSridFrom, codeSridTo, digits = null) {
    const fromProjection = getProjByCode(codeSridFrom);
    if (!fromProjection) return undefined
    const fromProj = fromProjection['proj4'];
    const toProjection = getProjByCode(codeSridTo);
    if (!toProjection) return undefined
    const toProj = toProjection['proj4'];
    if (!fromProj || !toProj)
        return featureBBox;

    var p1 = _point([Number(featureBBox.bbox[0]), Number(featureBBox.bbox[1])])
    var p2 = _point([Number(featureBBox.bbox[2]), Number(featureBBox.bbox[3])])

    const pp1 =  _projectFeature(p1, fromProj, toProj, digits);
    const pp2 =  _projectFeature(p2, fromProj, toProj, digits);

    var array = [pp1.geometry.coordinates[0], pp1.geometry.coordinates[1],
                 pp2.geometry.coordinates[0], pp2.geometry.coordinates[1]]

    var bbox = bboxPolygon(array);
    return bbox
}

export default { projectFeatureCollection, projectFeature, projectBBox }