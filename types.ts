
export enum RevealStage {
  FullyClothed = 0,
  SummerOutfit = 1,
  Bikini = 2
}

export interface ModelProfile {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  loading: boolean;
  stage: RevealStage;
  // History of generated images to prevent refetching previous stages
  stageImages: {
    [key in RevealStage]?: string;
  };
}
