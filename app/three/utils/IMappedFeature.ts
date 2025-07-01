interface IMappedFeature {
    featuregeom: number;
    geologicdescription: IGeologicdescription;
    name: string;
}

interface IGeologicdescription {
    citation: string;
    featureType: string;
}