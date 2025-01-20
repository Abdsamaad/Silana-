//thanks hann
import fs from "fs";
import path from "path";
import axios from "axios";
import { execSync } from "child_process";

let handler = async (m, { conn, text, prefix, command }) => {
  if (!text) return m.reply(`Example: ${prefix + command} hello`);
  if (text.length > 250) return m.reply(`Character limit exceeded, max 250!`);

  const words = text.split(" ");
  const tempDir = path.join(process.cwd(), 'lib');
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
  const framePaths = [];

  try {
    for (let i = 0; i < words.length; i++) {
      const currentText = words.slice(0, i + 1).join(" ");

      const res = await axios.get(
        `https://brat.caliphdev.com/api/brat?text=${encodeURIComponent(currentText)}`,
        { responseType: "arraybuffer" }
      ).catch((e) => e.response);

      const framePath = path.join(tempDir, `frame${i}.mp4`);
      fs.writeFileSync(framePath, res.data);
      framePaths.push(framePath);
    }

    const fileListPath = path.join(tempDir, "filelist.txt");
    let fileListContent = "";

    for (let i = 0; i < framePaths.length; i++) {
      fileListContent += `file '${framePaths[i]}'\n`;
      fileListContent += `duration 0.7\n`;
    }

    fileListContent += `file '${framePaths[framePaths.length - 1]}'\n`;
    fileListContent += `duration 2\n`;

    fs.writeFileSync(fileListPath, fileListContent);
    const outputVideoPath = path.join(tempDir, "output.mp4");
    execSync(
      `ffmpeg -y -f concat -safe 0 -i ${fileListPath} -vf "fps=30" -c:v libx264 -preset ultrafast -pix_fmt yuv420p ${outputVideoPath}`
    );

    await conn.sendFile(m.chat, outputVideoPath, "", "Here's your video!", m);

    framePaths.forEach((frame) => {
      if (fs.existsSync(frame)) fs.unlinkSync(frame);
    });
    if (fs.existsSync(fileListPath)) fs.unlinkSync(fileListPath);
    if (fs.existsSync(outputVideoPath)) fs.unlinkSync(outputVideoPath);
  } catch (e) {
    console.error(e);
    m.reply('An error occurred');
  }
};

handler.help = handler.command = ['bratvideo'];
handler.tags = ['tools'];
export default handler;
