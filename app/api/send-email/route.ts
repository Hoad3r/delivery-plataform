import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Criar um transporter usando Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'nossacozinhajp@gmail.com',
    pass: 'wiut icud vvhc iepr'
  }
});

export async function POST(request: Request) {
  try {
    const { to, subject, html } = await request.json();

    const info = await transporter.sendMail({
      from: 'Nossa Cozinha <nossacozinhajp@gmail.com>',
      to: to,
      subject: subject,
      html: html,
    });

    console.log('Email enviado:', info.messageId);
    return NextResponse.json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    return NextResponse.json({ error });
  }
}