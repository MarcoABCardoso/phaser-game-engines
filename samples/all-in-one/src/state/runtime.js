import { campaign } from './campaign.js';
import { createCampaignSaveService } from './saves.js';

export const campaignSaves = createCampaignSaveService(campaign);
