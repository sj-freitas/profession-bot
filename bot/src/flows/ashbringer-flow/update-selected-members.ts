import { Client } from "discord.js";
import { CONFIG } from "../../config";
import { createSheetClient } from "../../integrations/sheets/config";
import { PlayerInfoTable } from "../../integrations/sheets/player-info-table";
import { AshbringerPostConfigTable } from "../../integrations/sheets/ashbringer/ashbringer-post-config";
import { AshbringerCandidateSelectionTable } from "../../integrations/sheets/ashbringer/ashbringer-candidates-selection";

export async function updateAshbringerSelectedMembers(
  discordClient: Client,
): Promise<void> {
  if (new Date().getTime() <= new Date("08 April 2025 17:00 GMT").getTime()) {
    return;
  }

  const sheetClient = createSheetClient();
  const ashbringerPostConfigTable = new AshbringerPostConfigTable(
    sheetClient,
    CONFIG.GUILD.INFO_SHEET,
  );
  const ashbringerPostConfig = await ashbringerPostConfigTable.getValueById(
    CONFIG.GUILD.DISCORD_SERVER_ID,
  );
  if (!ashbringerPostConfig) {
    return;
  }
  const ashbringerCandidateSelection =
    await new AshbringerCandidateSelectionTable(
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
    ashbringerPostConfig.channelId,
  );
  if (
    !announcementChannel ||
    !announcementChannel.isSendable() ||
    !announcementChannel.isTextBased()
  ) {
    return;
  }

  // Generate the post
  const post = `# Ashbringer Nominee List
These are the players that we have selected as the receivers of the Ashbringer. The list is on order of who'll get it, so first we'd like to congratulate <@${playerMainMap.get(ashbringerCandidateSelection[0].name)}>!

> ${ashbringerCandidateSelection[0].reason}

## Here's the current list of ${ashbringerCandidateSelection.length} Ashbringer Receivers
The list is ordered by the officer's pick. If you have any questions regarding the order we are free to clarify.

${ashbringerCandidateSelection.map((t, idx) => `${idx + 1}. <@${playerMainMap.get(t.name)}>`).join("\n")}

We don't know exactly yet how The Ashbringer is obtained, but if there's a drop that is needed, the list is in the order of those drops. If a person isn't in a raid the next in line will get the item. If a person drops for any reason the next inline will be promoted, we'll keep the list at 3 people for as long as it makes sense.

Congratulations to all of you, your efforts are well known and respected in this guild!
Keep it up!`;

  if (!ashbringerPostConfig.postMessageId) {
    const message = await announcementChannel.send(post);

    await ashbringerPostConfigTable.updateValue({
      ...ashbringerPostConfig,
      postMessageId: message.id,
    });

    return;
  }

  const existingPost = await announcementChannel.messages.fetch(
    ashbringerPostConfig.postMessageId,
  );
  if (!existingPost || existingPost.content === post) {
    return;
  }

  await existingPost.edit(post);
}
