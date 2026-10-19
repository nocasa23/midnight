// ================= IMPORTURI =================
const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ChannelType, PermissionsBitField } = require("discord.js");
const express = require("express");
const path = require("node:path");

// ================= EXPRESS KEEP ALIVE (web service) =================
const app = express();
const PORT = process.env.PORT || 3000;
app.get("/", (req, res) => res.send("Bot is alive ✅"));
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// ================= DISCORD CLIENT =================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const OWNER_ID = ["1501204588643090512", "1510663071109218315"];
const TICKET_CATEGORY = "1543922465023983626";
const WELCOME_CHANNEL_ID = "1543922533995122698";
const COMMANDS_CHANNEL_ID = "1543922610713141290";
const NO_RESTRICTION_CHANNEL_ID = "1525971262285807759";
const BUMP_CHANNEL_ID = "1561856640712708186";

const SUPPORT_ROLES = ["1525861821460906194", "1503561405947711528"];
const PURGE_ROLES = ["1525861821460906194", "1503561405947711528"];

// ================= PROTECTED !help MESSAGE =================
const PROTECTED_MESSAGE_ID = "1543935711621947523";

// ================= BANNERE =================
const TICKET_BANNER = "support.gif";
const PURGE_BANNER = "deleted.gif";
const FUCK_GIFS = ["https://cdn.hentaigifz.com/84966/bounce-bounce.gif", "https://cdn.hentaigifz.com/88822/mankitsu-happening.gif"];
const WELCOME_BANNER = "welcome.gif";
const TICKET_CREATED = "ticket.gif";
const BUMP_BANNER = "bumpy.gif";
const COMMANDO_BANNER = "command.gif";

// ================= UTILS =================
function getRandomFuck() { return FUCK_GIFS[Math.floor(Math.random() * FUCK_GIFS.length)]; }

function hasStaffPermission(member) {
  if (OWNER_ID.includes(member.id)) return true;
  return member.roles.cache.some(role => PURGE_ROLES.includes(role.id));
}

// ================= VERIFICARE CANAL COMENZI =================
function isCommandsChannel(channelId) {
  return channelId === COMMANDS_CHANNEL_ID;
}

function isNoRestrictionChannel(channelId) {
  return channelId === NO_RESTRICTION_CHANNEL_ID;
}

// ================= ANTI-RAID + OWNER BYPASS =================
const userMessageMap = new Map();

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  const member = message.member;
  if (!member) return;
  const botAvatar = client.user.displayAvatarURL({ dynamic: true });

  const isNoRestriction = isNoRestrictionChannel(message.channel.id);

  if (!OWNER_ID.includes(message.author.id) && !isNoRestriction) {
    const userData = userMessageMap.get(message.author.id) || { count: 0, timer: null, lastMessage: Date.now() };
    userData.count += 1;
    if (Date.now() - userData.lastMessage < 1000) userData.count += 3;
    if (!userData.timer) userData.timer = setTimeout(() => userMessageMap.delete(message.author.id), 15000);
    userMessageMap.set(message.author.id, { ...userData, lastMessage: Date.now() });

    if (userData.count > 8) {
      await member.timeout(20 * 60 * 1000, "Raid/Spam").catch(() => null);
      await message.delete().catch(() => null);
      const embed = new EmbedBuilder().setColor(0x5A00A3).setTitle("Timed out!").setDescription("You have been timed out for raiding or spamming.").setThumbnail(botAvatar);
      await message.author.send({ embeds: [embed] }).catch(() => null);
      return;
    }

    const linkRegex = /(https?:\/\/|discord\.gg|discordapp\.com\/invite|bit\.ly|tinyurl|short\.link|youtu\.be|twitch\.tv)/i;
    if (linkRegex.test(message.content)) {
      await message.delete().catch(() => null);
      await member.timeout(15 * 60 * 1000, "Link - anti-raid").catch(() => null);
      const embed = new EmbedBuilder().setColor(0x5A00A3).setTitle("Links forbidden").setDescription("Any link = timeout.").setThumbnail(botAvatar);
      await message.author.send({ embeds: [embed] }).catch(() => null);
      return;
    }

    if (/injuries/i.test(message.content)) {
      await member.timeout(10 * 60 * 1000).catch(() => null);
      await message.delete().catch(() => null);
      const embed = new EmbedBuilder().setColor(0x5A00A3).setTitle("Timed out").setDescription("Stop 'injuries'.").setThumbnail(botAvatar);
      await message.author.send({ embeds: [embed] }).catch(() => null);
      return;
    }
  }

  if (isNoRestriction) {
    const content = message.content.toLowerCase();
    if (content.includes('discord.gg/') || content.includes('logged.tg/auth')) {
      await message.delete().catch(() => null);
      const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle("❌ Link Blocked!")
        .setDescription("You can't send server invites or auth links here!")
        .setFooter({ text: `Requested by ${message.author.username}` });
      await message.channel.send({ embeds: [embed] }).then(msg => {
        setTimeout(() => msg.delete().catch(() => null), 5000);
      }).catch(() => null);
      return;
    }
  }

  const isCommand = message.content.startsWith("!") && 
    (message.content.startsWith("!purge") || 
     message.content.startsWith("!fuck") || 
     message.content.startsWith("!help") || 
     message.content.startsWith("!create_ticket_panel") ||
     message.content.startsWith("!bump"));

  if (isCommand && !isCommandsChannel(message.channel.id) && !OWNER_ID.includes(message.author.id)) {
    await message.delete().catch(() => null);
    const errorEmbed = new EmbedBuilder()
      .setColor(0xFF0000)
      .setTitle("❌ Wrong Channel!")
      .setDescription(`Don't try using commands here r3tard go to\n<#${COMMANDS_CHANNEL_ID}>`)
      .setFooter({ text: `Requested by ${message.author.username}` });
    
    await message.channel.send({ embeds: [errorEmbed] }).then(msg => {
      setTimeout(() => msg.delete().catch(() => null), 5000);
    }).catch(() => null);
    return;
  }

  // !purge
  if (message.content.startsWith("!purge")) {
    if (!hasStaffPermission(member)) {
      return message.reply("❌ You don't have permission to use this command.");
    }

    try {
      const fetched = await message.channel.messages.fetch({ limit: 100 });
      const deleted = await message.channel.bulkDelete(fetched, true);
      const embed = new EmbedBuilder()
        .setColor(0x5A00A3)
        .setTitle("Successfully purged")
        .setDescription(`Deleted ${deleted.size} messages`)
        .setImage(`attachment://${PURGE_BANNER}`)
        .setFooter({ text: "𝔐𝔦𝔡𝔫𝔦𝔤𝔥𝔱𝔑𝔬𝔦𝔯 • Purge" });
      await message.channel.send({ embeds: [embed], files: [PURGE_BANNER] });
    } catch (e) {
      console.error("Purge failed:", e);
      message.reply("Purge failed. Check that the bot has Manage Messages permission.").catch(() => null);
    }
  }

  // !bump posts the reminder embed; it does not invoke another bot's slash command.
  if (message.content.trim() === "!bump") {
    const result = await sendBump();
    if (!result.ok) {
      await message.reply(`Couldn't post the bump reminder: ${result.reason}`).catch(() => null);
      return;
    }
  }

  // !fuck
  if (message.content.startsWith("!fuck")) {
    const mention = message.mentions.users.first();
    if (!mention) return message.reply("❌ Mention a user!");
    
    if (OWNER_ID.includes(mention.id)) {
      return message.reply("You can't fuck owner r3tard go fuck yourself!💔🥀");
    }
    
    if (message.author.id === "1505715261087678635") {
      return message.reply("U can't fuck nobody everyone broke yo ahh💔🥀");
    }
    
    await message.channel.send({ embeds: [new EmbedBuilder().setColor(0x5A00A3).setTitle(`Fucking ${mention.username}`).setDescription(`<@${mention.id}>`).setImage(getRandomFuck()).setFooter({ text: `Requested by ${message.author.username}` })] });
  }

  // !help
  if (message.content.startsWith("!help")) {
    const embed = new EmbedBuilder()
      .setColor(0x5A00A3)
      .setTitle("— <:12:1561848880608452729> HELP MENU —")
      .setDescription(
        `**Available Commands:**\n\n` +
        `**!fuck @user**\n` +
        `Sends a funny GIF message to the mentioned user.\n\n` +
        `**!purge**\n` +
        `(Owner + Staff) Deletes the last 100 messages in the current channel.\n\n` +
        `**!bump**\n` +
        `Posts a reminder to bump the server.\n\n` +
        `**!create_ticket_panel**\n` +
        `(Owner + Staff) Creates the ticket selection panel.`
        
      )
      .setImage(`attachment://${COMMANDO_BANNER}`)
      .setFooter({ text: `Requested by ${message.author.username}` });
    await message.channel.send({ embeds: [embed], files: [COMMANDO_BANNER] });
  }

  // !create_ticket_panel
  if (message.content.startsWith("!create_ticket_panel")) {
    if (!hasStaffPermission(member)) {
      return message.reply("❌ You don't have permission to use this command.");
    }

    const embedMain = new EmbedBuilder()
      .setColor(0x5A00A3)
      .setTitle(`—— <a:42:1561848948325359616>ꜱᴜᴘᴘᴏʀᴛ  ——`)
      .setDescription(`<a:arrow:1561864158587265094>ᴘʟᴇᴀꜱᴇ ᴄʜᴏᴏꜱᴇ ᴀ ʙᴜᴛᴛᴏɴ ʙᴇʟᴏᴡ ᴅᴇᴘᴇɴᴅɪɴɢ ᴏɴ ᴡʜᴀᴛ ᴛʏᴘᴇ ᴏꜰ ɪꜱꜱᴜᴇ ʏᴏᴜʀ ᴅᴇᴀʟɪɴɢ ᴡɪᴛʜ`)
      .setImage(`attachment://${TICKET_BANNER}`);

    const selectMenu = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("ticket_select")
        .setPlaceholder("Select Ticket Type")
        .addOptions([
          {
            label: "Bloxlink Verification",
            value: "bloxlink",
            emoji: { id: "1545850214064193576", name: "why", animated: true }
          },
          {
            label: "Roblox Groups Issues",
            value: "roblox_groups",
            emoji: { id: "1561848880608452729", name: "12", animated: true }
          },
          {
            label: "Others",
            value: "others",
            emoji: { id: "1561848948325359616", name: "42", animated: true }
          }
        ])
    );

    try {
      await message.channel.send({
        embeds: [embedMain],
        components: [selectMenu],
        files: [TICKET_BANNER]
      });
    } catch (error) {
      console.error("Failed to send ticket panel:", error);
      await message.reply("Couldn't create the ticket panel. Check the bot's Send Messages and Embed Links permissions.").catch(() => null);
    }
  }

});

// ================= WELCOME SYSTEM =================
client.on("guildMemberAdd", async (member) => {
  const welcomeFile = { attachment: path.join(__dirname, WELCOME_BANNER), name: WELCOME_BANNER };
  const welcomeChannel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID)
    || await member.guild.channels.fetch(WELCOME_CHANNEL_ID).catch(() => null);

  if (!welcomeChannel?.isTextBased() || !welcomeChannel.isSendable()) {
    console.error(`❌ Welcome channel ${WELCOME_CHANNEL_ID} was not found or cannot send messages.`);
  } else {
    const welcomeMain = new EmbedBuilder()
      .setColor(0x5A00A3)
      .setTitle(`<:12:1561848880608452729> Welcome to MidnightNoir Community!!`)
      .setDescription(
        `Read\n` +
        `<#1500916724327911454>\n\n` +
        `<#1532395654742278385>\n\n` +
        `create support tickets in <#1543938580177485824> if you want some help or if you have any questions\n` +
        `Remember to verify!!\n` +
        `<#1500916725112115210>`
      )
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
      .setImage(`attachment://${WELCOME_BANNER}`);

    await welcomeChannel.send({
      content: `<@${member.id}> <:12:1561848880608452729> has joined the server!`,
      embeds: [welcomeMain],
      files: [welcomeFile]
    }).catch(error => console.error("❌ Failed to send server welcome:", error));
  }

  const dmEmbed = new EmbedBuilder()
    .setColor(0x5A00A3)
    .setTitle("Welcome to MidnightNoir Community!!")
    .setDescription(
      `**<@${member.id}>**\n\n` +
      `don’t forget to verify to gain access to all channels`
    )
    .setImage(`attachment://${WELCOME_BANNER}`)
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }));

  await member.send({ embeds: [dmEmbed], files: [welcomeFile] })
    .catch(error => console.warn("⚠️ Could not send welcome DM (the member may have DMs disabled):", error.message));
});

// ================= INTERACTIONS =================
client.on("interactionCreate", async (interaction) => {
  if (interaction.isStringSelectMenu() && interaction.customId === "ticket_select") {
    const type = interaction.values[0];
    const member = interaction.member;
    const guild = interaction.guild;
    const channelName = `${member.user.username}-${type}`.toLowerCase().replace(/[^a-z0-9-]/g, "-");

    if (guild.channels.cache.find(c => c.name === channelName)) {
      return interaction.reply({ content: `You already have a ticket: #${channelName}`, ephemeral: true });
    }

    const ticketChannel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      parent: TICKET_CATEGORY,
      permissionOverwrites: [
        { id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
        ...SUPPORT_ROLES.map(r => ({ id: r, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] })),
        { id: member.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }
      ]
    });

    await interaction.reply({ content: `Ticket created: ${ticketChannel}`, ephemeral: true });

    const ticketMain = new EmbedBuilder()
      .setColor(0x5A00A3)
      .setTitle(`— <:32:1561848918936002601> TICKET CREATED —`)
      .setDescription(
        `**Welcome** <@${member.id}> !\n\n` +
        `Please describe what type of issue you have.\n` +
        `Staff will be with you shortly.`
      )
      .setImage(`attachment://${TICKET_CREATED}`);

    const closeButton = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("close_ticket")
        .setLabel("Close Ticket")
        .setStyle(ButtonStyle.Secondary)
    );

    await ticketChannel.send({
      embeds: [ticketMain],
      components: [closeButton],
      files: [TICKET_CREATED]
    });

    const supportMentions = SUPPORT_ROLES.map(roleId => `<@&${roleId}>`).join(' ');
    await ticketChannel.send({
      content: `${supportMentions}`
    });
  }

  if (interaction.isButton() && interaction.customId === "close_ticket") {
    await interaction.channel.delete().catch(() => null);
  }
});

// ================= AUTO-PURGE =================
async function autoPurge() {
  try {
    console.log("🔄 Auto-purge starting...");
    for (const guild of client.guilds.cache.values()) {
      for (const channelId of ["1525971262285807761"]) {
        const channel = guild.channels.cache.get(channelId);
        if (channel?.isTextBased()) {
          let fetched;
          let totalDeleted = 0;
          let hasMore = true;
          
          while (hasMore) {
            try {
              fetched = await channel.messages.fetch({ limit: 100 }).catch(() => null);
              if (!fetched || fetched.size === 0) {
                hasMore = false;
                break;
              }
              
              const toDelete = fetched.filter(m => m.id !== PROTECTED_MESSAGE_ID);
              if (toDelete.size > 0) {
                await channel.bulkDelete(toDelete, true).catch(() => null);
                totalDeleted += toDelete.size;
                console.log(`🗑️ Deleted ${toDelete.size} messages in ${channel.name} (Total: ${totalDeleted})`);
              }
              
              if (fetched.size < 100) {
                hasMore = false;
              }
              
              await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (err) {
              console.error("Error in auto-purge batch:", err);
              hasMore = false;
            }
          }
          
          if (totalDeleted > 0) {
            console.log(`✅ Auto-purge completed: Deleted ${totalDeleted} messages total in ${channel.name}`);
          } else {
            console.log(`ℹ️ No messages to delete in ${channel.name}`);
          }
        }
      }
    }
  } catch (err) { 
    console.error("❌ Auto-purge error:", err); 
  }
}

setInterval(autoPurge, 24 * 60 * 60 * 1000);
setTimeout(autoPurge, 5000);

// ================= AUTOMATIC BUMP =================
async function sendBump() {
  try {
    const channel = client.channels.cache.get(BUMP_CHANNEL_ID) || await client.channels.fetch(BUMP_CHANNEL_ID).catch(() => null);
    if (!channel?.isTextBased() || !channel.isSendable()) {
      console.error("❌ Bump channel not found or cannot send messages.");
      return { ok: false, reason: `Configured bump channel ${BUMP_CHANNEL_ID} was not found or is not a sendable text channel.` };
    }

    let inviteUrl = null;
    try {
      const invite = await channel.createInvite({
        maxAge: 0,
        maxUses: 0,
        unique: false,
        reason: "Server bump promotion"
      });
      inviteUrl = invite.url;
    } catch (inviteErr) {
      console.warn("⚠️ Could not create invite for bump channel, continuing without invite link:", inviteErr);
    }

    const description = inviteUrl
      ? `Remember to use !bump to bump the server!\n\n[**INVITE MORE MEMBERS FOR GIVEAWAY**](${inviteUrl})`
      : "Remember to use !bump to bump the server!\n\nInvite link temporarily unavailable.";

    const bumpEmbed = new EmbedBuilder()
      .setColor(0x5A00A3)
      .setTitle("Server Bump Reminder")
      .setDescription(description)
      .setImage(`attachment://${BUMP_BANNER}`);

    try {
      await channel.send({ embeds: [bumpEmbed], files: [BUMP_BANNER] });
      console.log("✅ Bump reminder embed sent in the bump channel.");
      return { ok: true, fallback: false };
    } catch (embedError) {
      console.warn("⚠️ Bump embed/image post failed; trying plain text:", embedError);
      const fallbackText = inviteUrl
        ? `Server bump reminder: use !bump to bump the server! Invite: ${inviteUrl}`
        : "Server bump reminder: use !bump to bump the server!";
      try {
        await channel.send({ content: fallbackText });
        console.warn("⚠️ Bump reminder posted as plain text; check Embed Links/Attach Files and the GIF path.");
        return { ok: true, fallback: true };
      } catch (sendError) {
        const code = sendError.code ? ` (Discord error ${sendError.code})` : "";
        const reason = `${sendError.message || "Discord rejected the message"}${code}`;
        console.error(`❌ Could not send bump reminder to channel ${BUMP_CHANNEL_ID}:`, sendError);
        return { ok: false, reason };
      }
    }
  } catch (error) {
    console.error("❌ Failed to send /bump:", error);
    const code = error.code ? ` (Discord error ${error.code})` : "";
    return { ok: false, reason: `${error.message || "Unexpected error"}${code}` };
  }
}

client.once("ready", async () => {
  console.log(`📢 Bump channel: ${BUMP_CHANNEL_ID}`);
  setTimeout(sendBump, 5000);
  setInterval(sendBump, 30 * 1000);
});

// LOGIN
client.login(TOKEN).then(() => console.log(`Logged in as ${client.user.tag}`));
