export class UpdateSocial {
  id: string;
  user_id: string;
  social_type: string;
  social_id: string;
  avatar: string;
  full_name: string;
  title: string;
  gender: string;
  type: string;
  follower_count: number;
  follower_growth_rate: number;
  impression_rate: number;
  engagement_rate: number;
  view_rate: number;
  audience_gender: number;
  audience_age: number;
  audience_location: number;
  cooperation_ratio: number;
  trade_cooperation_ratio: number;
  k_score: number;

  socialDetails: UpdateSocialDetail[];
}

export class UpdateSocialDetail {
  id: string;
  social_id: string;

  name: string;
  img: string;
  like: string;
  comment: string;
  view: string;
}
