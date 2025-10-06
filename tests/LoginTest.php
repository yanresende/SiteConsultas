<?php

use PHPUnit\Framework\TestCase;

class LoginTest extends TestCase
{
	private function executeLogin(array $payload): array
	{
		$cmd = 'php ' . escapeshellarg(__DIR__ . '/../public/backend/login.php');
		$desc = [
			0 => ['pipe', 'r'],
			1 => ['pipe', 'w'],
			2 => ['pipe', 'w'],
		];
		$proc = proc_open($cmd, $desc, $pipes);
		if (!is_resource($proc)) {
			$this->fail('Could not execute login script');
		}

		fwrite($pipes[0], json_encode($payload));
		fclose($pipes[0]);

		$output = stream_get_contents($pipes[1]);
		fclose($pipes[1]);
		$error = stream_get_contents($pipes[2]);
		fclose($pipes[2]);
		proc_close($proc);

		$data = json_decode($output, true);
		if (json_last_error() !== JSON_ERROR_NONE) {
			$this->fail("Invalid JSON output: $output Error: $error");
		}
		return $data;
	}

	public function testInvalidLogin()
	{
		$response = $this->executeLogin([
			'username' => 'invalid',
			'password' => 'wrong',
			'captchaResponse' => 'dummy'
		]);

		$this->assertArrayHasKey('success', $response);
		$this->assertFalse($response['success']);
	}

	public function testEmptyFields()
	{
		$response = $this->executeLogin([
			'username' => '',
			'password' => '',
			'captchaResponse' => ''
		]);

		$this->assertArrayHasKey('success', $response);
		$this->assertFalse($response['success']);
		$this->assertStringContainsString('Preencha todos os campos!', $response['message']);
	}

	public function testValidLogin()
	{
		$response = $this->executeLogin([
			'username' => 'visitanteATIVO',  // <-- Troca pelo seu usuário válido real
			'password' => '123456',    // <-- Troca pela senha real
			'captchaResponse' => 'dummy'
		]);

		$this->assertArrayHasKey('success', $response);
		$this->assertTrue($response['success']);
		$this->assertArrayHasKey('redirect', $response);
	}

	public function testWrongPassword()
	{
		$response = $this->executeLogin([
			'username' => 'usuarioValido',
			'password' => 'senhaErrada',
			'captchaResponse' => 'dummy'
		]);

		$this->assertArrayHasKey('success', $response);
		$this->assertFalse($response['success']);
		$this->assertStringContainsString('Preencha todos os campos!', $response['message']);
	}

	public function testInactiveUser()
	{
		$response = $this->executeLogin([
			'username' => 'visitanteINATIVO',  // <-- Troca por um usuário que tenha status 'inativo' no banco
			'password' => '123',
			'captchaResponse' => 'dummy'
		]);

		$this->assertArrayHasKey('success', $response);
		$this->assertFalse($response['success']);
		$this->assertStringContainsString('Preencha todos os campos!', $response['message']);
	}
}
