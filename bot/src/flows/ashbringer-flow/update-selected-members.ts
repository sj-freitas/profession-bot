import { Client } from "discord.js";
import { CONFIG } from "../../config";
import { createSheetClient } from "../../integrations/sheets/config";
import { PlayerInfoTable } from "../../integrations/sheets/player-info-table";
import { AshbringerPostConfigTable } from "../../integrations/sheets/ashbringer/ashbringer-post-config";
import { AshbringerCandidateSelectionTable } from "../../integrations/sheets/ashbringer/ashbringer-candidates-selection";

export async function updateAshbringerSelectedMembers(
  discordClient: Client,
): Promise<void> {
  if (new Date().getTime() <= new Date("12 April 2025 16:00 GMT").getTime()) {
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
  const post = `# The Ashbringer post
They kept it from us in Naxxramas, but the Ashbringer is finally available, along with what looks like quite a challenging raid.

Making this top ${ashbringerCandidateSelection.length} list was hard, and it's just the initial list. 
We aim to hand out many more than this, because we hope to be cleaning up in this Scarlet raid for many months to come.

But join us in congratulating:
${ashbringerCandidateSelection.map((t, idx) => `${idx + 1}. <@${playerMainMap.get(t.name)}>`).join("\n")}
on being our first Ashbringer recipients.

Special note to <@${playerMainMap.get(ashbringerCandidateSelection[0].name)}>:
> ${ashbringerCandidateSelection[0].reason}

We don't have all the information on how the Ashbringer is obtained yet, but we know the first step is a seemingly 100% quest item drop, after which you take a short trip to Naxxramas, leading into a "splinter of Atiesh" style materials gathering quest in the Scarlet Raid. 

That last one mentioned will likely be the main bottleneck once we have most of the raid on farm, but we are crossing our fingers that it's tuned to be close to the same speed as Atiesh overall. We want to get as many of these out to people as possible.

With that goal in mind we encourage people to spend some time reading/watching guides, and to keep an eye on our discord channels for each boss. 
As well as preparing for a challenging raid by stocking up on consumables. Both on your own and via GB-requests. 

The more prepared we are the faster we get a good feel for these bosses, and the faster we can start handing out the Shiny Swords to everyone who deserves them.`;

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
