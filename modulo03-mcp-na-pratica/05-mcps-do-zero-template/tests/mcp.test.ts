import { Client } from '@modelcontextprotocol/sdk/client';
import assert from 'node:assert';
import { describe, it, after, before } from 'node:test';
import { creatTestClient } from './helpers.ts';

export async function encryptMessage(client: Client, message: string, encryptionKey: string) {
  const result = await client.callTool({
    name: 'encrypt_message',
    arguments: {
      message,
      encryptionKey
    }
  }) as unknown as { structuredContent: { encryptedMessage: string } }
  return result;
}

export async function decryptMessage(client: Client, encryptedMessage: string, encryptionKey: string) {
  const result = await client.callTool({
    name: 'decrypt_message',
    arguments: {
      encryptedMessage,
      encryptionKey
    }
  }) as unknown as { structuredContent: { decryptedMessage: string } }
  return result;
}


describe('MCP Tool Tests', () => {
  let client: Client;
  let encryptionKey = 'my-super-passpharase'
  before(async () => {
    client = await creatTestClient()
  });

  after(async () => {
    await client.close()
  })
  it('should encrypt a message', async () => {
    const message = 'Helloe World';
    const result = await encryptMessage(client, message, encryptionKey);
    assert.ok(result.structuredContent?.encryptedMessage.length > 60, 'Encrypted message should not be empty');
  })
  it('should decrypt a message', async () => {
    const message = 'Heeeeeeey decrypted'
    const key = 'my-super-key';

    const { structuredContent: { encryptedMessage } } = await encryptMessage(client, message, key);

    const result = await decryptMessage(client, encryptedMessage, key)
    assert.deepStrictEqual(
      result.structuredContent.decryptedMessage,
      message, 'Decrypted message should match  original'
    );
  });
  it('Should list the encryption://info resource', async () => {
    const { resources } = await client.listResources();
    const info = resources.find(item => item.uri === 'encryption://info')

    assert.ok(info, 'encryption://info resource should be listed')
  })

  it('Should return the encrypt_message_prompt', async () => {
    const result = await client.getPrompt({
      name: 'encrypt_message_prompt',
      arguments: {
        message: 'Secret text',
        encryptionKey
      }
    })

    const item = result.messages.at(0)?.content as unknown as { text: string }

    const expected = `Please encrypt the following message using the encrypt_message tool. \nMessage: Secret text\nEncryption key: my-super-passpharase`;

    assert.deepStrictEqual(
      item.text,
      expected,
      'Prompt sould reference the encrypt_message_prompt tool'
    )

  })
})