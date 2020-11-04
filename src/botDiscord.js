require('dotenv').config();

const { Client } = require('discord.js');
const DisTube = require('distube');

const client = new Client();
config = {
  prefix: '!',
  token: process.env.DISCORD_WELCOME_BOT_TOKEN,
};

const distube = new DisTube(client, {
  searchSongs: true,
  emitNewSongOnly: true,
  highWaterMark: 1 << 25,
});

function contains(target, pattern) {
  var value = 0;
  pattern.forEach(function (word) {
    value = value + target.includes(word);
  });
  return value === 1;
}

const neverPlaysThisSongs = [
  'BTS',
  'KPOP',
  'K POP',
  'EXO',
  'BLACKPINK',
  'BLACK PINK',
  'SEVEN TEEN',
  'TWICE',
  'RED VEVELT',
  'REDVEVELT',
];

client.on('message', async (message) => {
  const toUpperMsg = message.content.toUpperCase();
  if (contains(toUpperMsg, neverPlaysThisSongs)) {
    message.channel.send('TA PROIBIDO KAPOPI PORRA');
    return;
  }
  if (message.author.bot) return;
  if (!message.content.startsWith(config.prefix)) return;

  const args = message.content.slice(config.prefix.length).trim().split(/ +/g);

  const command = args.shift();

  if (command == 'play') distube.play(message, args.join(' '));

  if (['repeat', 'loop'].includes(command))
    distube.setRepeatMode(message, parseInt(args[0]));

  if (command == 'stop') {
    distube.stop(message);
    message.channel.send('Parei essa porra!');
  }

  if (command == 'queue') {
    let queue = distube.getQueue(message);
    message.channel.send(
      'Fila atual:\n' +
        queue.songs
          .map(
            (song, id) =>
              `**${id + 1}**. ${song.name} - \`${song.formattedDuration}\``,
          )
          .join('\n'),
    );
  }

  if (
    [`3d`, `bassboost`, `echo`, `karaoke`, `nightcore`, `vaporwave`].includes(
      command,
    )
  ) {
    let filter = distube.setFilter(message, command);
    message.channel.send('Filtro da fila: ' + (filter || 'Off'));
  }
});

// Queue status template
const status = (queue) =>
  `Volume: \`${queue.volume}%\` | Filter: \`${
    queue.filter || 'Off'
  }\` | Repetir: \`${
    queue.repeatMode
      ? queue.repeatMode == 2
        ? 'FIla inteira'
        : 'Essa musica'
      : 'Off'
  }\` | Tocar automaticamente: \`${queue.autoplay ? 'On' : 'Off'}\``;

// DisTube event listeners, more in the documentation page
distube
  .on('playSong', (message, queue, song) =>
    message.channel.send(
      `Tocando \`${song.name}\` - \`${
        song.formattedDuration
      }\`\nO cria que pediu: ${song.user}\n${status(queue)}`,
    ),
  )
  .on('addSong', (message, queue, song) =>
    message.channel.send(
      `Adicionei ${song.name} - \`${song.formattedDuration}\` a fila, quem pediu foi o puto do ${song.user}`,
    ),
  )
  .on('playList', (message, queue, playlist, song) =>
    message.channel.send(
      `Play \`${playlist.name}\` playlist (${
        playlist.songs.length
      } songs).\nAnimal que pediu ai: ${song.user}\nDj ta soltando: \`${
        song.name
      }\` - \`${song.formattedDuration}\`\n${status(queue)}`,
    ),
  )
  .on('addList', (message, queue, playlist) =>
    message.channel.send(
      `Adicionei \`${playlist.name}\` uma playlist (${
        playlist.songs.length
      } musicas) na fila. Cara mais egoista!\n${status(queue)}`,
    ),
  )
  // DisTubeOptions.searchSongs = true
  .on('searchResult', (message, result) => {
    let i = 0;
    message.channel.send(
      `**Escolha uma opcao abaixo**\n${result
        .map(
          (song) => `**${++i}**. ${song.name} - \`${song.formattedDuration}\``,
        )
        .join('\n')}\n*Digite algo ou espere 60 segundos para cancelar.*`,
    );
  })
  // DisTubeOptions.searchSongs = true
  .on('searchCancel', (message) =>
    message.channel.send(`Vo procura mais nada nao tio`),
  )
  .on('error', (message, err) => message.channel.send('Error: ' + err));

client.login(process.env.DISCORD_WELCOME_BOT_TOKEN);