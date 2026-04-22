export class EmailService {
  async sendPasswordReset(email: string, token: string): Promise<void> {
    console.log(`[EmailService] Password reset email sent to ${email}`);
    console.log(`[EmailService] Reset token: ${token}`);
  }

  async sendInvitation(email: string, orgName: string, token: string): Promise<void> {
    console.log(`[EmailService] Invitation email sent to ${email} for org "${orgName}"`);
    console.log(`[EmailService] Invitation token: ${token}`);
  }
}

export const emailService = new EmailService();
