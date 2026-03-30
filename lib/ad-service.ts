import { exec } from "child_process";
import { promisify } from "util";
import { logger } from "@/lib/logger";
import { sanitizeForPowerShell } from "@/lib/security";

const execAsync = promisify(exec);

export class ADService {
  private static async runPowerShell(script: string): Promise<string> {
    const fullScript = `
      $ErrorActionPreference = 'Stop';
      try {
        ${script}
      } catch {
        $err = $_.Exception.Message;
        Write-Output "ERROR_PS: $err";
      }
    `;
    
    const base64Command = Buffer.from(fullScript, "utf16le").toString("base64");
    const command = `powershell.exe -NoProfile -ExecutionPolicy Bypass -EncodedCommand ${base64Command}`;
    
    try {
      const { stdout } = await execAsync(command, { maxBuffer: 1024 * 1024 });
      const output = stdout.trim();
      
      if (output.startsWith("ERROR_PS:")) {
        throw new Error(output.replace("ERROR_PS:", "").trim());
      }
      
      return output;
    } catch (error: any) {
      logger.error("[AD_SERVICE]", error);
      throw error;
    }
  }

  static async findUser(username: string) {
    const safeUsername = sanitizeForPowerShell(username);
    const ldapPath = process.env.AD_LDAP_PATH || "";
    const adUser = process.env.AD_USER || "";
    const adPass = process.env.AD_PASSWORD || "";
    
    // SEGURANÇA: Todas as variáveis de ambiente usam single-quotes no PowerShell,
    // impedindo expansão de variáveis ($) e backticks (`)
    const safeLdap = sanitizeForPowerShell(ldapPath);
    const safeAdUser = sanitizeForPowerShell(adUser);
    const safeAdPass = sanitizeForPowerShell(adPass);
    
    const psScript = `
      $ldap = if ('${safeLdap}') { '${safeLdap}' } else { $null };
      $user = '${safeAdUser}';
      $pass = '${safeAdPass}';
      
      $entry = if ($ldap -and $user -and $pass) { 
          New-Object System.DirectoryServices.DirectoryEntry($ldap, $user, $pass) 
      } elseif ($ldap) { 
          New-Object System.DirectoryServices.DirectoryEntry($ldap) 
      } else { 
          $null 
      };

      $searcher = if ($entry) { New-Object System.DirectoryServices.DirectorySearcher($entry) } else { [adsisearcher]"" };
      $searcher.Filter = "(&(objectClass=user)(objectCategory=person)(sAMAccountName=${safeUsername}))";
      
      $result = $searcher.FindOne();
      if ($result) {
          $userEntry = $result.GetDirectoryEntry();
          $mobileValue = if ($userEntry.Properties["mobile"].Value) { [string]$userEntry.Properties["mobile"].Value -replace '[^0-9]', '' } else { $null };
          $displayNameValue = if ($userEntry.Properties["displayName"].Value) { [string]$userEntry.Properties["displayName"].Value } else { '${safeUsername}' };

          $data = @{ 
              found = $true; 
              mobile = if ($mobileValue -and $mobileValue.Length -ge 8) { $mobileValue } else { $null };
              displayName = $displayNameValue;
              distinguishedName = [string]$userEntry.Properties["distinguishedName"].Value;
          };
          $data | ConvertTo-Json -Compress;
      } else { 
          @{ found = $false } | ConvertTo-Json -Compress;
      }
    `;
    
    const output = await this.runPowerShell(psScript);
    return JSON.parse(output);
  }

  static async resetPassword(username: string, newPassword: string) {
    const safeUsername = sanitizeForPowerShell(username);
    const ldapPath = process.env.AD_LDAP_PATH || "";
    const adUser = process.env.AD_USER || "";
    const adPass = process.env.AD_PASSWORD || "";
    
    const safeLdap = sanitizeForPowerShell(ldapPath);
    const safeAdUser = sanitizeForPowerShell(adUser);
    const safeAdPass = sanitizeForPowerShell(adPass);
    
    // Codifica a senha em Base64 para evitar que caracteres especiais sejam interpretados pelo PowerShell
    const base64Password = Buffer.from(newPassword, "utf16le").toString("base64");
    
    const psScript = `
      $ldap = if ('${safeLdap}') { '${safeLdap}' } else { $null };
      $user = '${safeAdUser}';
      $pass = '${safeAdPass}';
      
      $entry = if ($ldap -and $user -and $pass) { 
          New-Object System.DirectoryServices.DirectoryEntry($ldap, $user, $pass) 
      } elseif ($ldap) { 
          New-Object System.DirectoryServices.DirectoryEntry($ldap) 
      } else { 
          $null 
      };

      $searcher = if ($entry) { New-Object System.DirectoryServices.DirectorySearcher($entry) } else { [adsisearcher]"" };
      $searcher.Filter = "(&(objectClass=user)(objectCategory=person)(sAMAccountName=${safeUsername}))";
      
      $result = $searcher.FindOne();
      if ($result) {
          $userEntry = $result.GetDirectoryEntry();
          
          $newPassRaw = [System.Text.Encoding]::Unicode.GetString([System.Convert]::FromBase64String("${base64Password}"));
          
          $userEntry.Invoke("SetPassword", @($newPassRaw));
          $userEntry.Properties["lockoutTime"].Value = 0;
          $userEntry.Properties["pwdLastSet"].Value = -1;
          $userEntry.CommitChanges();
          Write-Output "OK";
      } else {
          Write-Output "ERROR_PS: Usuário AD não localizado no caminho especificado.";
      }
    `;
    
    await this.runPowerShell(psScript);
    return true;
  }
}
