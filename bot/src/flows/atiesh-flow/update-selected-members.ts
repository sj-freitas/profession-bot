import { Client } from "discord.js";
import { AtieshPostConfigTable } from "../../integrations/sheets/atiesh/atiesh-post-config";
import { CONFIG } from "../../config";
import { createSheetClient } from "../../integrations/sheets/config";
import { AtieshCandidateSelectionTable } from "../../integrations/sheets/atiesh/atiesh-candidates-selection";
import { PlayerInfoTable } from "../../integrations/sheets/player-info-table";

export async function updateAtieshSelectedMembers(
  discordClient: Client,
): Promise<void> {
  if (
    new Date().getTime() <= new Date("07 February 2025 17:00 GMT").getTime()
  ) {
    return;
  }

  const sheetClient = createSheetClient();
  const atieshPostConfigTable = new AtieshPostConfigTable(
    sheetClient,
    CONFIG.GUILD.INFO_SHEET,
  );
  const atieshPostConfig = await atieshPostConfigTable.getValueById(
    CONFIG.GUILD.DISCORD_SERVER_ID,
  );
  if (!atieshPostConfig) {
    return;
  }
  const atieshCandidateSelection = await new AtieshCandidateSelectionTable(
    sheetClient,
    CONFIG.GUILD.INFO_SHEET,
  ).getAllValues();
  const playerConfig = await new PlayerInfoTable(
    sheetClient,
    CONFIG.GUILD.INFO_SHEET,
  ).getAllValues();
  const playerMainMap = new Map(
    playerConfig.map((t) => [t.mainName, t.discordId]),
  );

  const announcementChannel = await discordClient.channels.fetch(
    atieshPostConfig.channelId,
  );
  if (
    !announcementChannel ||
    !announcementChannel.isSendable() ||
    !announcementChannel.isTextBased()
  ) {
    return;
  }

  // Generate the post
  const post = `# Atiesh Nominee List
These are the players that we have selected as the receivers of Atiesh. The list is on order of who'll get it, so first we'd like to congratulate <@${playerMainMap.get(atieshCandidateSelection[0].name)}>!

> ${atieshCandidateSelection[0].reason}

## Here's the current list of ${atieshCandidateSelection.length} Atiesh Receivers
The list is ordered by the officer's pick. If you have any questions regarding the order we are free to clarify.

${atieshCandidateSelection.map((t, idx) => `${idx + 1}. <@${playerMainMap.get(t.name)}>`).join("\n")}

Once the 40 splinters of Atiesh is completed, the person at number 2 is promoted to number 1 and so on. If a person isn't in a raid the next in line will get the splinter. If a person drops for any reason someone else will be promoted, we'll keep the list at 4 people for as long as it makes sense.

Congratulations to all of you, your efforts are well known and respected in this guild!
Keep it up!`;

  if (!atieshPostConfig.postMessageId) {
    const message = await announcementChannel.send(post);

    await atieshPostConfigTable.updateValue({
      ...atieshPostConfig,
      postMessageId: message.id,
    });

    return;
  }

  const existingPost = await announcementChannel.messages.fetch(
    atieshPostConfig.postMessageId,
  );
  if (!existingPost || existingPost.content === post) {
    return;
  }

  await existingPost.edit(post);
}
